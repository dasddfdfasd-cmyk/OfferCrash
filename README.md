# OfferCrash

OfferCrash 是一个产品经理大厂校招压力面试 Agent。用户上传 DOCX 简历后，系统解析简历文本，生成候选人档案，进入 AI 面试会议室，由 AI 面试官主动提问和追问，最后生成面试诊断报告。

## 当前能力

- DOCX 简历上传与纯文本解析
- 基于文本模型抽取 `candidateProfile`
- 字节 / 腾讯两类面试风格
- AI 面试会议室演示流程
- 基于 `interviewRecords` 生成 `report`
- 模型失败时自动 fallback 到 Mock 数据，保证演示不中断

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

构建检查：

```bash
npm run build
```

## 配置真实文本模型

后端通过 `lib/llm.ts` 调用 OpenAI-compatible Chat Completions API。

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写环境变量：

```bash
NEXT_PUBLIC_DEMO_MODE=false

TEXT_MODEL_API_KEY=sk-xxx
TEXT_MODEL_BASE_URL=https://your-openai-compatible-host/v1
TEXT_MODEL_NAME=your-model-name
```

调用格式：

```text
POST ${TEXT_MODEL_BASE_URL}/chat/completions
Authorization: Bearer ${TEXT_MODEL_API_KEY}
Content-Type: application/json
```

请求体使用：

```json
{
  "model": "TEXT_MODEL_NAME",
  "messages": [
    {
      "role": "user",
      "content": "prompt"
    }
  ],
  "temperature": 0.2
}
```

注意：`TEXT_MODEL_API_KEY` 只在服务端 API route 中读取，不要放入任何 `NEXT_PUBLIC_` 变量。

## 演示模式与 Fallback

如果不配置真实文本模型，或者模型请求失败、模型返回无法解析为 JSON，系统会自动 fallback：

- `/api/extract-profile` 返回 `mockCandidateProfile`
- `/api/report/generate` 返回 `mockReport`

fallback 响应会包含：

```json
{
  "success": true,
  "fallback": true,
  "error": "具体失败原因"
}
```

这样不会影响完整演示路径。

## 测试接口

测试候选人档案抽取：

```bash
curl -X POST http://127.0.0.1:3000/api/extract-profile \
  -H "Content-Type: application/json" \
  -d "{\"rawText\":\"候选人做过校园二手交易小程序，负责用户调研、需求分析和原型设计。\"}"
```

测试报告生成：

```bash
curl -X POST http://127.0.0.1:3000/api/report/generate \
  -H "Content-Type: application/json" \
  -d "{\"candidateProfile\":{\"targetRole\":\"产品经理\",\"candidateSummary\":\"测试候选人\",\"mainProjects\":[],\"overallRiskPoints\":[]},\"companyStyle\":\"bytedance\",\"interviewRecords\":[{\"role\":\"assistant\",\"stage\":\"项目追问\",\"type\":\"project_deep_dive\",\"content\":\"请介绍你的项目。\",\"roundIndex\":1},{\"role\":\"user\",\"stage\":\"项目追问\",\"type\":\"project_deep_dive\",\"content\":\"我做过校园二手交易小程序，主要负责用户调研和原型设计，但没有统计具体数据。\",\"roundIndex\":1}],\"duration\":\"08:42\"}"
```

## 完整演示路径

首页 → 上传页 → 简历解析结果页 → 面试官配置页 → AI 面试会议室 → 面试诊断报告页
