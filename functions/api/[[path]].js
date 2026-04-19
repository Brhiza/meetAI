// Cloudflare Pages Functions 同源代理
// 前端 "在线 AI" 模式调用 /api/chat/completions 等路径，由此代理转发到真实上游
// 环境变量（在 Cloudflare Pages 项目 Settings → Environment variables 里配置，不要带 VITE_ 前缀）：
//   API_URL   例如 https://api.openai.com/v1
//   API_KEY   真实密钥（仅服务端可见，前端 bundle 里不会出现）
//   API_MODEL 在线 AI 模式下使用的模型名（前端不传 model 时由此填充；前端显式传了就尊重前端）

// 过滤掉这些响应头（hop-by-hop 或会干扰流式传输）
const STRIPPED_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
]);

// 首字节超时：Cloudflare Pages Functions 单请求默认约 30 秒，留点余量
const UPSTREAM_TIMEOUT_MS = 25000;

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const apiUrl = (env.API_URL || "").replace(/\/+$/, "");
  const apiKey = env.API_KEY || "";

  if (!apiUrl || !apiKey) {
    return json({ error: "服务端未配置 API_URL / API_KEY 环境变量" }, 500);
  }

  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api/, "") || "/";
  const upstreamUrl = apiUrl + subpath + (url.search || "");

  const init = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "text/event-stream, application/json",
    },
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    let bodyText = await request.text();
    if (bodyText) {
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && typeof parsed === "object" && "model" in parsed && !parsed.model) {
          if (!env.API_MODEL) {
            return json({ error: "服务端未配置 API_MODEL 环境变量（在线 AI 模式下必填）" }, 500);
          }
          parsed.model = env.API_MODEL;
          bodyText = JSON.stringify(parsed);
        }
      } catch {
        // body 不是合法 JSON，保持原样转发
      }
    }
    init.body = bodyText;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  init.signal = controller.signal;

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch (err) {
    clearTimeout(timer);
    if (err && err.name === "AbortError") {
      return json({ error: `上游 API ${UPSTREAM_TIMEOUT_MS / 1000} 秒内未返回首字节，已终止` }, 504);
    }
    return json({ error: `上游连接失败：${err && err.message ? err.message : "unknown"}` }, 502);
  }
  clearTimeout(timer);

  const headers = new Headers();
  for (const [k, v] of upstream.headers.entries()) {
    if (STRIPPED_HEADERS.has(k.toLowerCase())) continue;
    headers.set(k, v);
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-cache, no-transform");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
