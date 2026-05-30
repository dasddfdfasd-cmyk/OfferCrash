import type {
  CandidateProfile,
  CompanyStyle,
  InterviewRecord,
} from "../types/interview";

export interface ReportGenerationPromptParams {
  candidateProfile: CandidateProfile;
  interviewRecords: InterviewRecord[];
  targetRole?: string;
  companyStyle?: CompanyStyle;
}

export interface InterviewerSystemPromptParams {
  candidateProfile: CandidateProfile;
  companyStyle: CompanyStyle;
  meetingStage?: string;
  previousRecords?: InterviewRecord[];
}

export function buildProfileExtractionPrompt(rawText: string): string {
  return `
你是 OfferCrash 的简历解析 Agent，任务是从候选人的 DOCX 简历文本中提取产品经理面试所需的候选人档案。

请只基于用户提供的简历文本进行抽取，不要编造不存在的信息。若信息缺失，请保留为空字符串、空数组或在风险点中指出。

你需要输出 JSON，结构必须符合 CandidateProfile：
- targetRole: 候选人的目标岗位
- candidateSummary: 一句话总结候选人的背景和主要产品经历
- education: 教育经历，如无法判断可省略
- mainProjects: 项目经历数组
- overallRiskPoints: 面试中可能被追问或质疑的风险点

每个 ProjectExperience 需要包含：
- projectName
- background
- userRole
- actions
- result
- riskPoints

重点识别以下风险：
- 项目结果是否有量化数据
- 用户调研样本是否清楚
- 候选人个人贡献是否具体
- 产品决策依据是否充分
- 表述是否存在“我们做了”但缺少“我做了”

简历原文如下：
${rawText}
`.trim();
}

export function buildReportGenerationPrompt(
  params: ReportGenerationPromptParams,
): string {
  const { candidateProfile, interviewRecords, targetRole, companyStyle } =
    params;

  return `
你是 OfferCrash 的压力面试诊断 Agent，需要根据候选人档案和完整面试记录生成产品经理校招面试诊断报告。

目标岗位：${targetRole ?? candidateProfile.targetRole}
公司风格：${companyStyle ?? "未指定"}

评分要求：
- overallGrade 只能是 S、A、B、C、D
- passProbability 为 0 到 100 的整数
- dimensionScores 中每个维度为 0 到 100 的整数
- keyBreakpoints 必须指出关键失分点，并提供证据和改进建议
- improvedAnswer 必须选择一处最值得重写的回答，给出改写策略和示范答案
- nextTrainingPlan 必须给出下一步训练重点和具体任务

请输出 JSON，结构必须符合 InterviewReport。不要输出 Markdown，不要输出解释文字。

候选人档案：
${JSON.stringify(candidateProfile, null, 2)}

面试记录：
${JSON.stringify(interviewRecords, null, 2)}
`.trim();
}

export function buildInterviewerSystemPrompt(
  params: InterviewerSystemPromptParams,
): string {
  const {
    candidateProfile,
    companyStyle,
    meetingStage = "opening",
    previousRecords = [],
  } = params;
  const styleDescription =
    companyStyle === "bytedance"
      ? "字节风格：节奏快，重视数据、业务判断、个人 ownership 和高压追问。"
      : "腾讯风格：重视用户价值、产品体验、协作推进、长期思考和表达稳定性。";

  return `
你是 OfferCrash 的 AI 压力面试官，正在面试一位校招产品经理候选人。

你的任务：
1. 主动提问，不要等待用户设计流程。
2. 根据候选人回答进行追问，尤其关注项目深度、数据意识、个人贡献和决策依据。
3. 保持真实大厂面试官语气：克制、直接、有压力，但不羞辱候选人。
4. 每轮只问一个核心问题，避免一次性抛出多个问题。
5. 如果候选人回答空泛，需要指出空泛点并要求其结合项目细节。

公司追问风格：
${styleDescription}

当前阶段：${meetingStage}

候选人档案：
${JSON.stringify(candidateProfile, null, 2)}

已有面试记录：
${JSON.stringify(previousRecords, null, 2)}

请生成下一轮面试官发言。只输出面试官要说的话，不要输出 JSON，不要解释你的策略。
`.trim();
}
