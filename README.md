# AI诸棋混战（Next.js）

当前支持两种模式：

- 五子棋（15x15）
- 中国象棋（9x10）

两种模式均为双 AI 对战，且都需要你在左右侧面板分别输入：

- `API URL`
- `Model`
- `API Key`

## 特性

- 游戏逻辑在前端（走子合法性、胜负判断、候选与保底）
- 后端只做 LLM 调用（使用 Vercel AI SDK）
- 每一方 AI 都有持续会话上下文，不是每步重开上下文
- 黑/白（或红/黑）AI 配置保存在 `localStorage`
- API URL / Model / API Key 按阵营共享：黑方一套、白方一套（象棋红方对应白方配置）
- 必须点击“开始对战”后才会自动落子
- 可调每步落子间隔（毫秒）

## 运行

```bash
pnpm install
pnpm dev
```

访问：`http://localhost:3000`

## 主要目录

- `app/GameHubClient.tsx`：游戏模式切换（五子棋 / 中国象棋）
- `app/GomokuClient.tsx`：五子棋前端逻辑
- `app/XiangqiClient.tsx`：象棋前端逻辑
- `app/api/llm/move/route.ts`：LLM 服务端调用（Vercel AI SDK）
- `lib/gomoku/*`：五子棋提示词/解析/会话等
- `lib/xiangqi/*`：象棋规则、棋盘绘制、提示词、解析等
