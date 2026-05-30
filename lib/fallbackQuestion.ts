import type { CandidateProfile, CompanyStyle } from "@/types/interview";

type LocalFallbackQuestionParams = {
  candidateProfile: CandidateProfile;
  companyStyle: CompanyStyle;
  lastUserAnswer: string;
  roundIndex: number;
};

export function getLocalFallbackQuestion({
  companyStyle,
  lastUserAnswer,
  roundIndex,
}: LocalFallbackQuestionParams) {
  if (roundIndex >= 7) {
    return {
      nextQuestion: "好，本轮面试先到这里。接下来系统会生成你的面试诊断报告。",
      stage: "收尾",
      type: "收尾",
      reason: "达到最大追问轮数",
      shouldEnd: true,
    };
  }

  if (/(提升|优化|改善|增长|提高)/.test(lastUserAnswer)) {
    return {
      nextQuestion: "你刚才提到做了优化，具体优化了哪个指标？上线前后有什么变化？",
      stage: "数据追问",
      type: "指标追问",
      reason: "回答中出现优化或提升表述，需要追问数据口径",
      shouldEnd: false,
    };
  }

  const teamMentionCount = (lastUserAnswer.match(/我们|团队/g) ?? []).length;
  if (teamMentionCount >= 2) {
    return {
      nextQuestion: "你刚才多次提到团队，我想知道你个人最不可替代的贡献是什么？",
      stage: "项目深挖",
      type: "个人贡献追问",
      reason: "回答中团队表述较多，需要追问个人贡献",
      shouldEnd: false,
    };
  }

  if (/用户|调研|访谈|需求/.test(lastUserAnswer)) {
    return {
      nextQuestion: "你提到了用户需求判断，这个判断来自多少用户样本？他们分别是什么类型的用户？",
      stage: "用户洞察",
      type: "用户样本追问",
      reason: "回答涉及用户需求，需要追问样本和真实性",
      shouldEnd: false,
    };
  }

  if (lastUserAnswer.trim().length < 40) {
    return {
      nextQuestion: "你这个回答还比较概括。请具体说一个你亲自做的决策，以及为什么这么做。",
      stage: "表达追问",
      type: "细节追问",
      reason: "回答较短，需要继续追问具体细节",
      shouldEnd: false,
    };
  }

  return {
    nextQuestion:
      companyStyle === "bytedance"
        ? "你这个项目最后如何衡量成功？有没有明确的数据指标？"
        : "你怎么判断这个需求是真实存在的，而不是你们团队自己的假设？",
    stage: companyStyle === "bytedance" ? "数据追问" : "用户洞察",
    type: companyStyle === "bytedance" ? "结果指标追问" : "需求真实性追问",
    reason: "使用公司风格对应的快速追问",
    shouldEnd: false,
  };
}
