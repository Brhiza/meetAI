# 春心 AI 后端对外接入文档

本文档面向第三方应用开发者，说明如何调用春心后端的 AI 代理接口获取 AI 回复。接口采用 OpenAI 兼容格式，支持同步与 SSE 流式输出。

## 1. 接口概览

| 项 | 值 |
|---|---|
| Base URL | `https://api.xushuo.cc` |
| AI 代理端点 | `POST /api/proxy` |
| 可用模型 | `free/cc` |
| 健康检查 | `GET /api/test` |
| CORS | 默认放行 `*.xushuo.cc`；其他域名需在后端 `ALLOWED_ORIGINS` 环境变量中追加 |
| 鉴权 | 无 API Key，靠 `X-Client-ID` 做配额与限流隔离 |
| 速率限制 | 20 次 / 分钟 / client |
| 每日配额 | 500 次 / client / 日 |

## 2. 请求格式（OpenAI 兼容）

请求头：

```
Content-Type: application/json
X-Client-ID: <稳定的客户端标识>
```

请求体：

```json
{
  "model": "free/cc",
  "messages": [
    { "role": "system", "content": "你是一个助手" },
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "stream": true
}
```

## 3. 响应格式

### 3.1 非流式（`stream: false`）

原样返回 OpenAI 兼容结构：

```json
{
  "choices": [
    { "message": { "content": "AI 回复文本" } }
  ],
  "usage": { "..." : "..." }
}
```

### 3.2 流式（`stream: true`，SSE）

**注意：不是标准 OpenAI SSE 格式**，春心后端已经预处理成简化结构：

```
data: {"content":"第一段增量"}

data: {"content":"第二段增量"}

data: {"done":true}
```

出错时：

```
data: {"error":"错误信息"}
```

> `EventSource` 只支持 GET，必须使用 `fetch` + `ReadableStream` 自行解析。

## 4. X-Client-ID：给每个终端用户独立配额

后端按 `X-Client-ID` 独立计数（`server.js` 中 `clientId = req.headers['x-client-id'] || req.headers['x-session-id'] || req.ip`）。不同 ID 互不影响配额，每个 ID 独享 500 次/日。

### 命名建议

建议采用 `<appName>-<type>-<id>` 的结构，便于春心后台识别调用来源、排查滥用：

- 登录用户：`<appName>-uid-<账号ID>`（例如 `myapp-uid-12345`）
- 匿名用户：`<appName>-anon-<uuid>`（例如 `myapp-anon-xxxxxxxx`）

下文示例中的 `myapp` 请替换为你的应用名。

### 方案 A：应用已有登录账号（推荐）

用账号主键派生，跨设备同步，清缓存也不丢配额：

```js
function getClientId(user) {
  return `myapp-uid-${user.id}`;
}
```

### 方案 B：匿名访问

用 `crypto.randomUUID()` 生成并写入 `localStorage`：

```js
function getClientId() {
  let id = localStorage.getItem('myapp_client_id');
  if (!id) {
    id = 'myapp-anon-' + crypto.randomUUID();
    localStorage.setItem('myapp_client_id', id);
  }
  return id;
}
```

缺点：用户清缓存、换浏览器、隐身模式都会重置配额，存在被刷空间。如需防刷，建议在应用自家后端签发带 HMAC 签名的 ID，再按 IP/UA 去重。

### 方案 C：登录则按账号，未登录则按匿名

```js
function getClientId(user) {
  if (user?.id) return `myapp-uid-${user.id}`;
  let id = localStorage.getItem('myapp_client_id');
  if (!id) {
    id = 'myapp-anon-' + crypto.randomUUID();
    localStorage.setItem('myapp_client_id', id);
  }
  return id;
}
```

## 5. 浏览器前端示例

完整可用的 ES Module 代码。使用前把 `APP_PREFIX` 替换为你的应用名：

```js
// utils/aiClient.js
const AI_BASE = 'https://api.xushuo.cc';
const APP_PREFIX = 'myapp';
const MODEL = 'free/cc';

function getClientId(user) {
  if (user?.id) return `${APP_PREFIX}-uid-${user.id}`;
  const key = `${APP_PREFIX}_client_id`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${APP_PREFIX}-anon-` + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// 非流式
export async function chat(messages, { user, temperature = 0.7 } = {}) {
  const res = await fetch(`${AI_BASE}/api/proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': getClientId(user),
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, stream: false }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

// 流式：onChunk(delta, fullText) 每拿到一段增量触发一次
export async function chatStream(messages, onChunk, { user, temperature = 0.7, signal } = {}) {
  const res = await fetch(`${AI_BASE}/api/proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': getClientId(user),
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`AI ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const obj = JSON.parse(payload);
        if (obj.error) throw new Error(obj.error);
        if (obj.done) return full;
        if (obj.content) {
          full += obj.content;
          onChunk(obj.content, full);
        }
      } catch {
        /* 忽略非 JSON 行 */
      }
    }
  }
  return full;
}
```

调用示例：

```js
import { chatStream } from './utils/aiClient.js';

chatStream(
  [{ role: 'user', content: '用三句话总结：...' }],
  (delta, full) => {
    document.getElementById('out').textContent = full;
  },
  { user: currentUser }
);
```

## 6. curl 自测

非流式：

```bash
curl -s https://api.xushuo.cc/api/proxy \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: test-client-001" \
  -d '{"model":"free/cc","messages":[{"role":"user","content":"你好"}],"stream":false}'
```

流式：

```bash
curl -N https://api.xushuo.cc/api/proxy \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: test-client-001" \
  -d '{"model":"free/cc","messages":[{"role":"user","content":"讲个笑话"}],"stream":true}'
```

## 7. 错误码速查

| HTTP | 场景 | 处理建议 |
|---|---|---|
| 400 | 缺参 / 上下文超长（`CONTEXT_TOO_LARGE`） | 裁剪 `messages` 长度 |
| 429 | 限流或配额耗尽（`QUOTA_EXCEEDED`） | 读响应头 `X-RateLimit-Remaining`，或提示用户稍后再试 |
| 500 / 502 | 上游 AI 异常 | 稍后重试 |

## 8. 注意事项

- **X-Client-ID 必须稳定且唯一**：全站共用一个 ID 会很快触顶；每个终端用户一个 ID 才能各自享 500 次/日。
- **前缀规范**：推荐使用 `<appName>-uid-<账号ID>` 或 `<appName>-anon-<uuid>`，便于春心后台识别调用来源与定位滥用。
- **上下文上限**：以后端 `MAX_PROXY_CONTEXT_CHARS` 为准，超出会返回 400，需自行裁剪历史消息。
- **流式解析**：后端已把上游 SSE 转成 `{content}` / `{done}` / `{error}` 三种简化负载，按本文档示例解析即可，不要套用 OpenAI 原始 SSE 格式。
- **CORS**：后端 `isOriginAllowed` 对 `*.xushuo.cc` 默认放行；若应用部署在其他域名，请联系春心维护方在 `ALLOWED_ORIGINS` 环境变量中追加。
- **仅使用公共接口**：本文档仅涉及 `/api/proxy`、`/api/test`，不要在前端调用或暴露 `/api/admin/*` 等内部管理接口。
