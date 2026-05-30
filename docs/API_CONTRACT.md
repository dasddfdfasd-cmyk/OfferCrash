# OfferCrash API Contract

本文档定义 OfferCrash 前端与后端 API 的接口契约。当前后端支持 DOCX 简历解析、候选人档案抽取和面试报告生成。

## POST /api/upload-docx

### 请求参数

`Content-Type: multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | File | 是 | 用户上传的 `.docx` 简历文件，最大 5MB |

### 成功返回

```json
{
  "success": true,
  "rawText": "从 DOCX 中解析出的简历纯文本",
  "fileName": "candidate.docx"
}
```

### 失败返回

```json
{
  "success": false,
  "error": "文件不是 .docx"
}
```

### 前端使用场景

用户在上传简历时调用该接口。前端拿到 `rawText` 后，继续调用 `/api/extract-profile` 生成候选人档案。上传失败时，前端仍可通过示例简历继续完整流程。

## POST /api/extract-profile

### 请求参数

`Content-Type: application/json`

```json
{
  "rawText": "DOCX 解析后的简历纯文本"
}
```

### 成功返回

```json
{
  "success": true,
  "candidateProfile": {},
  "fallback": false
}
```

### 失败/兜底返回

参数错误会返回失败：

```json
{
  "success": false,
  "error": "简历文本不能为空"
}
```

模型失败或 JSON 解析失败时不阻断流程，返回 Mock 档案：

```json
{
  "success": true,
  "candidateProfile": {},
  "fallback": true
}
```

### 前端使用场景

上传简历并得到 `rawText` 后调用该接口。返回的 `candidateProfile` 用于档案页展示、AI 面试官追问上下文和最终报告生成。

## POST /api/report/generate

### 请求参数

`Content-Type: application/json`

```json
{
  "candidateProfile": {},
  "companyStyle": "bytedance",
  "interviewRecords": [],
  "duration": "08:42"
}
```

### 成功返回

```json
{
  "success": true,
  "report": {},
  "fallback": false
}
```

### 失败/兜底返回

参数错误会返回失败：

```json
{
  "success": false,
  "error": "候选人档案不能为空"
}
```

模型失败或 JSON 解析失败时不返回 500，兜底返回 Mock 报告：

```json
{
  "success": true,
  "report": {},
  "fallback": true
}
```

### 前端使用场景

AI 面试会议结束后调用该接口。返回的 `report` 用于渲染诊断报告页，包括总评级、通过概率、分项得分、关键失分点、示范改写和训练计划。
