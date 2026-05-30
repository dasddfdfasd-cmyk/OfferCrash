# OfferCrash

OfferCrash 是一个产品经理大厂校招压力面试 Agent。用户上传 DOCX 简历后，系统解析简历文本，生成候选人档案，进入 AI 面试会议室，由 AI 面试官主动提问和追问，最终生成面试诊断报告。

## 核心功能

- DOCX 简历上传与纯文本解析
- 候选人档案抽取
- 字节、腾讯两类面试风格支持
- AI 面试官 Prompt 构建
- 面试记录结构化存储
- 面试诊断报告生成
- 模型失败时使用 Mock 数据兜底，保证演示流程不中断

## 技术栈

- React 19
- Vite
- Next.js App Router API Routes
- TypeScript
- Tailwind CSS
- mammoth.js
- OpenAI-compatible Chat Completions

## AI 能力调用说明

后端通过 `lib/llm.ts` 调用 OpenAI-compatible Chat Completions 接口。接口地址、模型名称和 API Key 均从服务端环境变量读取，不会暴露到前端。

当前涉及两类模型任务：

- `/api/extract-profile`：根据 DOCX 解析出的 `rawText` 抽取 `CandidateProfile`
- `/api/report/generate`：根据候选人档案和面试记录生成 `InterviewReport`

如果环境变量缺失、模型调用失败或模型返回内容无法解析为 JSON，接口会返回 Mock 数据并标记 `fallback: true`。

## 本地运行

安装依赖：

```bash
npm install
```

启动前端演示：

```bash
npm run dev
```

构建检查：

```bash
npm run build
```

类型检查：

```bash
npx tsc --noEmit
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填写服务端模型配置：

```bash
NEXT_PUBLIC_DEMO_MODE=true

TEXT_MODEL_API_KEY=
TEXT_MODEL_BASE_URL=
TEXT_MODEL_NAME=
```

说明：

- `NEXT_PUBLIC_DEMO_MODE`：前端演示模式开关
- `TEXT_MODEL_API_KEY`：文本模型 API Key，只能放在服务端环境变量中
- `TEXT_MODEL_BASE_URL`：OpenAI-compatible 接口基础地址
- `TEXT_MODEL_NAME`：文本模型名称

## 演示模式

当模型环境变量缺失或模型调用失败时，后端会自动使用 `lib/mockData.ts` 中的数据兜底：

- `mockCandidateProfile`
- `mockInterviewTurns`
- `mockInterviewRecords`
- `mockReport`

这样可以保证上传简历、生成档案、进入面试和生成报告的演示链路保持可用。

## 当前完成度

已完成：

- 基础类型定义
- Mock 数据
- Prompt 构建函数
- DOCX 解析工具
- JSON 安全解析工具
- 文本模型调用工具
- `/api/upload-docx`
- `/api/extract-profile`
- `/api/report/generate`
- API 契约文档
- GitHub 双人协作流程文档

## 后续规划

- 将前端上传页接入 `/api/upload-docx`
- 将候选人档案页接入 `/api/extract-profile`
- 将报告页接入 `/api/report/generate`
- 增加面试过程中的实时追问 API
- 增加接口级测试和异常样例
- 补充 `.env.local` 的部署说明
