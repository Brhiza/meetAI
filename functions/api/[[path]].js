// Cloudflare Pages Functions 同源代理
// 前端 "在线 AI" 模式可选走同源代理：若配置了 API_URL / API_KEY，前端会探测到并走 /api/chat/completions
// 否则前端默认直连春信后端（cx.xushuo.cc）
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

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);

  // 前端探测用：不转发上游，直接告诉前端是否已配置好可走 functions
  if (url.pathname === "/api/__probe") {
    return json({
      configured: Boolean(env.API_URL && env.API_KEY),
    });
  }

  const apiUrl = (env.API_URL || "").replace(/\/+$/, "");
  const apiKey = env.API_KEY || "";

  if (!apiUrl || !apiKey) {
    return json({ error: "服务端未配置 API_URL / API_KEY 环境变量" }, 500);
  }

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

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch (err) {
    return json({ error: `上游连接失败：${err && err.message ? err.message : "unknown"}` }, 502);
  }

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
