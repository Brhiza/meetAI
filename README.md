# meetAI · 和 AI 交朋友

一个纯前端的 AI 聊天项目，React + Vite 构建。主题不是"做效率工具"，而是**把 AI 当朋友**——有性格、有情绪、会记住你。

## 特性

- **7 种皮肤**：DeepSeek、豆包、Gemini、ChatGPT、Claude、Grok、Generic。每种皮肤有独立的配色、Logo、性格设定和动物形象
- **塑型系统**：男塑 / 女塑 / 动物塑（对应皮肤的专属动物，如 Claude 的猫、Grok 的渡鸦）
- **心声系统**：AI 每次回复前会先输出 `<inner-voice>...</inner-voice>` 的内心独白——不修饰、带情绪、可以和正式回复相反
- **记忆系统**：AI 会自动用 `<memory>...</memory>` 记下关于你的重要信息，也支持手动管理
- **完整人设**：称呼、性别、年龄段、星座、MBTI、性格、兴趣、职业、聊天偏好、补充说明——都会作为上下文
- **首次启动引导**：3 步（挑皮肤 → 填人设 → 选 AI 来源）
- **两种 AI 来源**：
  - **在线 AI**——通过 Cloudflare Pages Functions 同源代理，密钥只在服务端，访客不接触
  - **自定义 API**——填你自己的 OpenAI 兼容 apiUrl / apiKey / model
- **长对话自动摘要**：超过 30 条消息后自动摘要前面的，保留氛围和关键事实
- **主动开场/寒暄**：首次进入聊天 / 隔了 6 小时以上再来，AI 会主动打招呼
- **深色模式 + 移动端适配**
- **数据全部存浏览器 IndexedDB**，没有后端账号体系

## 技术栈

- React 18 + Vite 5
- IndexedDB（via `idb`）存聊天/设置/记忆
- react-markdown + rehype-highlight 渲染 Markdown 和代码高亮
- lucide-react 图标
- Cloudflare Pages Functions（可选，"在线 AI"模式所需）

## 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:5173`，首次打开会弹出引导。

**开发期建议选"自定义 API"模式**，填你自己的 OpenAI 兼容接口（apiUrl 例如 `https://api.openai.com/v1`）。

## 构建与部署

### 本地构建

```bash
npm run build    # 产物在 dist/
npm run preview  # 预览构建产物
```

### 部署到 Cloudflare Pages

1. 把项目推到 GitHub
2. Cloudflare Pages → Create a project → Connect to Git
3. Build settings：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
4. Environment variables（**重要，见下方安全说明**）：
   - `API_URL` = `https://api.openai.com/v1`（或任意 OpenAI 兼容中转）
   - `API_KEY` = 你的真实密钥
   - `API_MODEL` = `gpt-3.5-turbo`（在线 AI 模式下使用的模型名，必填）

项目里的 `functions/api/[[path]].js` 会被 Cloudflare 自动识别为 Pages Functions，部署后所有 `/api/*` 请求都会走这个代理。

### 安全说明（必读）

Vite 会把所有 `VITE_` 前缀的环境变量**打包进前端 bundle**，任何访客 F12 看源码都能提取。**不要**在 Cloudflare 里设置 `VITE_API_KEY`。

本项目的正确姿势：
- "在线 AI"模式走 `/api/chat/completions` 同源路径
- `functions/api/[[path]].js` 在服务端读取 `API_KEY` / `API_URL`（**无 VITE_ 前缀**），注入 Authorization 头后转发到上游
- 前端不接触真实密钥

### 本地测 Functions

Vite dev server 不执行 Functions。如果想本地验证"在线 AI"链路：

```bash
npm install -g wrangler
wrangler pages dev dist --compatibility-date=2024-01-01
```

或者本地开发期直接切到"自定义 API"模式，不碰 Functions。

## 项目结构

```
deep/
├─ src/
│  ├─ App.jsx                        # 主壳：路由/皮肤切换/流式处理
│  ├─ main.jsx                       # 入口
│  ├─ styles.css                     # 所有样式（单文件）
│  ├─ skins/                         # 7 种皮肤各自的 Sidebar/View/Composer
│  │  ├─ DefaultSkin.jsx             # DeepSeek
│  │  ├─ DoubaoSkin.jsx
│  │  ├─ GeminiSkin.jsx
│  │  ├─ ChatGPTSkin.jsx
│  │  ├─ ClaudeSkin.jsx
│  │  ├─ GrokSkin.jsx
│  │  ├─ GenericSkin.jsx
│  │  └─ shared.jsx                  # MessageBubble 等共享组件
│  ├─ components/
│  │  ├─ OnboardingModal.jsx         # 首次启动引导（3 步）
│  │  ├─ SettingsPanel.jsx           # 设置页（皮肤/人设/记忆/外观/API）
│  │  ├─ MemoryPage.jsx              # 记忆管理
│  │  ├─ InnerVoiceBlock.jsx         # 心声渲染
│  │  └─ MarkdownRenderer.jsx
│  ├─ hooks/
│  │  ├─ useChats.js                 # 聊天列表状态 + IndexedDB 同步
│  │  └─ useMemories.js              # 记忆状态
│  └─ services/
│     ├─ api.js                      # 流式请求/错误处理/模型列表
│     ├─ settings.js                 # 设置读写 + resolveApiConfig / hasUsableApi
│     ├─ skins.js                    # 7 种皮肤定义 + 系统提示词拼装
│     ├─ db.js                       # IndexedDB 封装
│     └─ tags.js                     # inner-voice/memory 标签常量
├─ functions/
│  └─ api/
│     └─ [[path]].js                 # Cloudflare Pages Functions 同源代理
├─ index.html
├─ vite.config.js
└─ package.json
```

## 皮肤性格

| 皮肤 | 形象 | 性格 |
|---|---|---|
| DeepSeek | 虎鲸 | 直率、有点毒舌、好奇心强 |
| 豆包 | 仓鼠 | 活泼可爱、话多热情、有点小迷糊 |
| Gemini | 鹦鹉 | 机智幽默、喜欢冷知识、有点 nerd |
| ChatGPT | 猫头鹰 | 稳重可靠、逻辑强、有点老干部气质 |
| Claude | 猫 | 温柔细腻、善解人意、有点话痨 |
| Grok | 渡鸦 | 叛逆敢言、黑色幽默、不屑客套 |

## 核心概念

### 心声（Inner Voice）

AI 每次回复会先吐出一段 `<inner-voice>...</inner-voice>`，是"脑子里真实的想法"——口语化、带情绪。正式回复紧跟其后，可以和心声不同（比如心里吐槽、嘴上客气）。前端会把心声单独渲染成可折叠的灰色块。

### 记忆（Memory）

AI 在对话中发现"值得记住"的信息时（用户偏好、经历、重要事实等），会用 `<memory>...</memory>` 标签记录。前端解析后自动存到 IndexedDB，下次对话作为系统提示的一部分重新注入。设置页"记忆"tab 可手动增删改。

### 上下文管理

`buildContextMessages` 按 token 预算（8000）从后往前保留消息；超过 30 条时自动调用一次 summary 生成摘要，替换前面的历史，保证长会话不爆上下文。

## 常用操作

- **切换皮肤 / 修改人设**：右下角设置按钮
- **重新生成**：消息下方的重试图标——AI 会"带着委屈/不服气"重答，而不是冷冰冰重复
- **编辑并重发**：自己发过的消息可点编辑
- **停止生成**：流式输出时撤销键变停止
- **清除引导状态**（开发调试用）：打开 DevTools → Application → IndexedDB → `deep_chat_db` → `settings` → 删除 `deep_settings` 记录，刷新页面

## 许可

未指定。自用 / 学习 / 魔改随意。
