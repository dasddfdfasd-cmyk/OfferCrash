# OfferCrash API Contract

本文档定义前端与后端/Agent 服务之间的基础接口契约。当前阶段用于前端联调、Mock 数据替换和后续模型调用接入。

## POST /api/upload-docx

### 请求方式

`POST`

### 请求参数

`Content-Type: multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | File | 是 | 用户上传的 DOCX 简历文件 |

### 成功返回

```json
{
  "success": true,
  "data": {
    "fileId": "resume_20260530_001",
    "fileName": "candidate_resume.docx",
    "rawText": "从 DOCX 中解析出的简历纯文本",
    "uploadedAt": "2026-05-30T09:00:00.000Z"
  }
}
```

### 失败返回

```json
{
  "success": false,
  "error": {
    "message": "仅支持 DOCX 文件",
    "status": 400
  }
}
```

### 前端使用场景

用户在简历上传页选择 DOCX 文件后调用该接口。前端拿到 `rawText` 后，可继续调用 `/api/extract-profile` 生成候选人档案。

## POST /api/extract-profile

### 请求方式

`POST`

### 请求参数

`Content-Type: application/json`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| rawText | string | 是 | DOCX 解析后的简历纯文本 |
| targetRole | string | 否 | 用户选择或系统推断的目标岗位，默认可为“产品经理” |

### 成功返回

```json
{
  "success": true,
  "data": {
    "targetRole": "产品经理",
    "candidateSummary": "候选人具备校园二手交易小程序项目经历，主要负责用户调研、需求分析和原型设计。",
    "education": "本科",
    "mainProjects": [
      {
        "projectName": "校园二手交易小程序",
        "background": "校园内二手物品交易信息分散，买卖双方匹配效率较低。",
        "userRole": "负责用户调研、需求分析和原型设计。",
        "actions": ["访谈校园用户", "梳理核心流程", "输出产品原型"],
        "result": "完成核心交易流程设计。",
        "riskPoints": ["项目结果数据不明确", "个人贡献不够具体"]
      }
    ],
    "overallRiskPoints": [
      "项目结果数据不明确",
      "个人贡献不够具体",
      "用户调研样本未知",
      "产品决策依据不足"
    ]
  }
}
```

### 失败返回

```json
{
  "success": false,
  "error": {
    "message": "简历文本不能为空",
    "status": 400
  }
}
```

### 前端使用场景

用户上传简历后，前端调用该接口生成 `CandidateProfile`，用于展示候选人档案、驱动 AI 面试官追问，并作为最终报告生成的输入之一。

## POST /api/report/generate

### 请求方式

`POST`

### 请求参数

`Content-Type: application/json`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| candidateProfile | CandidateProfile | 是 | 候选人档案 |
| interviewRecords | InterviewRecord[] | 是 | 完整面试对话记录 |
| companyStyle | "bytedance" \| "tencent" | 否 | 面试官风格 |

### 成功返回

```json
{
  "success": true,
  "data": {
    "overallGrade": "B",
    "passProbability": 58,
    "eliminationRisk": "中等偏高。候选人具备基础产品意识，但数据结果、个人贡献和决策依据表达不足。",
    "oneSentenceFeedback": "你能讲清楚项目做了什么，但还没有讲清楚为什么这么做、做得多好，以及哪些关键结果来自你。",
    "dimensionScores": {
      "structuredExpression": 72,
      "projectDepth": 66,
      "userInsight": 68,
      "dataSense": 42,
      "personalContribution": 55,
      "pressureResistance": 61
    },
    "keyBreakpoints": [
      {
        "title": "项目结果缺少量化闭环",
        "impact": "面试官难以判断项目真实效果。",
        "evidence": "被追问交易效率提升多少时，没有给出指标。",
        "suggestion": "补充上线前后对比指标和指标定义。"
      }
    ],
    "interviewerMostDissatisfied": "最不满意的是数据意识不足。",
    "improvedAnswer": {
      "originalQuestion": "你说提升了交易效率，具体提升了多少？",
      "originalIssue": "原回答没有提供指标口径。",
      "rewriteStrategy": "承认数据不足，补充替代指标，并说明复盘方案。",
      "sampleAnswer": "这个项目当时确实没有完整埋点，这是我的不足..."
    },
    "nextTrainingPlan": {
      "focus": "补强项目量化表达、个人贡献归因和压力追问回应。",
      "tasks": ["补一版指标口径", "重写项目介绍", "准备压力追问答案"]
    }
  }
}
```

### 失败返回

```json
{
  "success": false,
  "error": {
    "message": "面试记录不能为空",
    "status": 400
  }
}
```

### 前端使用场景

AI 面试会议室结束后，前端将候选人档案和完整面试记录提交给该接口。返回的 `InterviewReport` 用于渲染面试诊断报告页，包括总评级、通过概率、分项得分、关键失分点、示范改写和训练计划。
