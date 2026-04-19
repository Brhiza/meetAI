// Cloudflare Pages Functions 同源代理
// 前端 "在线 AI" 模式调用 /api/chat/completions 等路径，由此代理转发到真实上游
// 环境变量（在 Cloudflare Pages 项目 Settings → Environment variables 里配置，不要带 VITE_ 前缀）：
//   API_URL   例如 https://api.openai.com/v1
//   API_KEY   真实密钥（仅服务端可见，前端 bundle 里不会出现）
//   API_MODEL 可选，仅作参考

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
    },
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const headers = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (err) {
    return json({ error: `上游请求失败：${err && err.message ? err.message : "unknown"}` }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
