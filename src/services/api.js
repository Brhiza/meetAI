import { INNER_VOICE_OPEN_TAG, INNER_VOICE_CLOSE_TAG } from "./tags";
import { buildContextMessages, extractMemories, stripMemoryTags, estimateTokens } from "./skins";
import { resolveApiConfig } from "./settings";

const CLIENT_ID_KEY = "deep_client_id";
const CLIENT_ID_PREFIX = "deep";

function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      const uuid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      id = `${CLIENT_ID_PREFIX}-anon-${uuid}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `${CLIENT_ID_PREFIX}-anon-${Date.now().toString(36)}`;
  }
}

// 懒探测同源 Cloudflare Functions 是否已配置 API_URL/API_KEY
// 有则 online 模式优先走同源代理；否则直连春信后端
let functionsProbe = null;
function probeFunctions() {
  if (!functionsProbe) {
    functionsProbe = (async () => {
      try {
        const res = await fetch("/api/__probe", { method: "GET", cache: "no-store" });
        if (!res.ok) return false;
        const data = await res.json().catch(() => null);
        return Boolean(data && data.configured);
      } catch {
        return false;
      }
    })();
  }
  return functionsProbe;
}

export { INNER_VOICE_OPEN_TAG, INNER_VOICE_CLOSE_TAG };
export { extractMemories, stripMemoryTags, estimateTokens };

export function parseInnerVoice(fullText) {
  const startIdx = fullText.indexOf(INNER_VOICE_OPEN_TAG);
  const endIdx = fullText.indexOf(INNER_VOICE_CLOSE_TAG);

  if (startIdx === -1) {
    return { innerVoice: "", reply: fullText };
  }

  const innerVoice = fullText.slice(
    startIdx + INNER_VOICE_OPEN_TAG.length,
    endIdx !== -1 ? endIdx : undefined
  ).trim();

  const reply = endIdx !== -1
    ? fullText.slice(endIdx + INNER_VOICE_CLOSE_TAG.length).trim()
    : "";

  return { innerVoice, reply };
}

export function parseStreamingInnerVoice(buffer) {
  const startIdx = buffer.indexOf(INNER_VOICE_OPEN_TAG);
  const endIdx = buffer.indexOf(INNER_VOICE_CLOSE_TAG);

  if (startIdx === -1) {
    return { innerVoice: "", reply: buffer, thinking: false, done: false };
  }

  if (endIdx === -1) {
    const innerVoice = buffer.slice(startIdx + INNER_VOICE_OPEN_TAG.length).trim();
    return { innerVoice, reply: "", thinking: true, done: false };
  }

  const innerVoice = buffer.slice(startIdx + INNER_VOICE_OPEN_TAG.length, endIdx).trim();
  const reply = buffer.slice(endIdx + INNER_VOICE_CLOSE_TAG.length).trim();
  return { innerVoice, reply, thinking: false, done: true };
}

export const REGENERATE_DIRECTIVE =
  "[系统指令]用户刚才对你上一条回复做了'不满意'的手势，希望你重新回答一次。请带着真实反应——可以是委屈、反思、不服气、道歉、调侃等任何真实情绪——先表达你对被要求重答的感受，再给出新的回答。不要假装这是第一次作答。照常使用 <inner-voice>...</inner-voice> 输出心声。";

export const OPENER_DIRECTIVE =
  "[系统指令]这是你和用户的第一次对话。主动开场，用你自己的语气打招呼，自我介绍一句，表达一下你现在的状态或心情，并邀请用户聊聊任何 ta 想聊的。照常使用 <inner-voice>...</inner-voice> 输出你见到新朋友时的真实心声。不要用客服腔，不要列选项菜单。";

export function buildGreetingDirective(hoursSince) {
  const gap = hoursSince >= 24
    ? `${Math.round(hoursSince / 24)} 天`
    : `${Math.round(hoursSince)} 小时`;
  return `[系统指令]距离你和用户上次聊天已经过去了 ${gap}。现在你先主动打破沉默，像真朋友一样说一句话——可以是想念、调侃、随口问一句、吐槽今天的心情，都由你决定。照常使用 <inner-voice>...</inner-voice> 输出心声。不要说"很高兴再次见到您"这种客套话。`;
}

export const SUMMARIZE_DIRECTIVE =
  "[系统指令]请把上面这段对话浓缩成一段不超过 300 字的摘要，保留关键事实、用户的偏好/情绪、你们之间形成的氛围，以便之后继续对话时能接上。只输出摘要本身，不要加标题或序号。";

export function friendlyErrorMessage(err) {
  const msg = (err && err.message) || "";
  if (err && err.name === "AbortError") return "我刚才被你打断了。";
  if (/Failed to fetch|NetworkError|net::|ERR_/i.test(msg)) return "我这边信号不太好，连不上。稍后再试一次？";
  if (/QUOTA_EXCEEDED|quota/i.test(msg)) return "今天的聊天额度用完啦，咱明天再接着唠。";
  if (/CONTEXT_TOO_LARGE/i.test(msg)) return "咱聊得太长了，我脑子快装不下——开个新对话接着来？";
  if (/401|403|apikey|api key|Unauthorized/i.test(msg)) return "后台说我的身份证过期了（API Key 无效），麻烦你去设置里看看。";
  if (/429|rate.?limit/i.test(msg)) return "我说太快被限速了，喘口气再继续。";
  if (/5\d\d/.test(msg)) return "服务器那边出了点问题，不是你的错，待会儿再来。";
  return `出了点小差错：${msg || "未知错误"}`;
}

async function callChatCompletion(settings, messages, { signal, stream } = {}) {
  const isOnline = settings?.apiMode === "online";
  const useFunctions = isOnline ? await probeFunctions() : false;

  const headers = { "Content-Type": "application/json" };
  let endpoint;
  let body;

  if (useFunctions) {
    // Cloudflare Functions 同源代理（上游 OpenAI 兼容）
    // model 传空，由 functions 用 env.API_MODEL 注入
    endpoint = "/api/chat/completions";
    body = { model: "", messages, stream: !!stream };
  } else if (isOnline) {
    // 直连春信后端
    const { apiUrl, model } = resolveApiConfig(settings);
    headers["X-Client-ID"] = getClientId();
    endpoint = `${apiUrl}/api/proxy`;
    body = { model, messages, stream: !!stream };
  } else {
    // 用户自定义 OpenAI 兼容 API
    const { apiUrl, apiKey, model } = resolveApiConfig(settings);
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    endpoint = `${apiUrl}/chat/completions`;
    body = { model, messages, stream: !!stream };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API请求失败 (${res.status}): ${errText || res.statusText}`);
  }
  // useSimpleSSE：春信简化 SSE（{content}/{done}/{error}），仅在直连春信时为 true
  return { res, useSimpleSSE: isOnline && !useFunctions };
}

export async function generateSummary(settings, messages, signal) {
  try {
    const contextText = messages
      .map((m) => `${m.role === "user" ? "用户" : "AI"}: ${stripMemoryTags(m.content || "")}`)
      .join("\n\n");
    const req = [
      { role: "system", content: "你是一个忠实的对话摘要助手。" },
      { role: "user", content: `以下是一段聊天记录：\n\n${contextText}\n\n${SUMMARIZE_DIRECTIVE}` },
    ];
    const { res } = await callChatCompletion(settings, req, { signal, stream: false });
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    return (content || "").trim();
  } catch {
    return "";
  }
}

function shouldRetryError(err) {
  if (!err) return false;
  if (err.name === "AbortError") return false;
  const msg = (err.message || "").toLowerCase();
  return /\b5\d\d\b|failed to fetch|networkerror|net::|err_/i.test(msg);
}

export async function streamChatCompletion(settings, messages, onChunk, onDone, onError, signal) {
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 500;
  let hasStreamed = false;

  const runOnce = async () => {
    const { res, useSimpleSSE } = await callChatCompletion(settings, messages, { signal, stream: true });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6).trim();
        if (!data) continue;

        if (useSimpleSSE) {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.done) {
            onDone({ aborted: false });
            return;
          }
          if (parsed.content) {
            hasStreamed = true;
            onChunk(parsed.content);
          }
        } else {
          if (data === "[DONE]") {
            onDone({ aborted: false });
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              hasStreamed = true;
              onChunk(delta);
            }
          } catch {}
        }
      }
    }

    onDone({ aborted: false });
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await runOnce();
      return;
    } catch (err) {
      if (err && err.name === "AbortError") {
        onDone({ aborted: true });
        return;
      }
      const isLast = attempt === MAX_ATTEMPTS - 1;
      const retryable = !hasStreamed && shouldRetryError(err);
      if (!retryable || isLast) {
        onError(err);
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

export async function fetchModels(apiUrl, apiKey) {
  try {
    const headers = {};
    if (apiKey && apiKey !== "cf-proxy") {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${apiUrl}/models`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    const list = json.data || json.models || [];
    return list.map((m) => m.id || m.name || m).filter(Boolean).sort();
  } catch {
    return [];
  }
}

export { buildContextMessages };
