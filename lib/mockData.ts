import type {
  CandidateProfile,
  InterviewRecord,
  InterviewReport,
  InterviewTurn,
} from "../types/interview";

export const mockCandidateProfile: CandidateProfile = {
  targetRole: "产品经理",
  candidateSummary:
    "候选人具备校园二手交易小程序项目经历，主要负责用户调研、需求分析和原型设计。",
  mainProjects: [
    {
      projectName: "校园二手交易小程序",
      background:
        "校园二手交易信息主要散落在微信群和朋友圈，用户查找、发布和沟通成本较高。",
      userRole: "负责用户调研、需求分析、原型设计和核心流程梳理。",
      actions: [
        "访谈校园用户，整理买家和卖家的高频痛点。",
        "拆解商品发布、分类浏览、搜索筛选和沟通确认流程。",
        "输出需求文档和原型，推动团队明确 MVP 功能优先级。",
      ],
      result:
        "完成校园二手交易小程序核心链路设计，覆盖发布、浏览、搜索和站内沟通。",
      riskPoints: [
        "项目结果数据不明确",
        "个人贡献不够具体",
        "用户调研样本未知",
        "产品决策依据不足",
      ],
    },
  ],
  overallRiskPoints: [
    "项目结果数据不明确",
    "个人贡献不够具体",
    "用户调研样本未知",
    "产品决策依据不足",
  ],
};

export const mockInterviewTurns: InterviewTurn[] = [
  {
    stage: "自我介绍",
    type: "opening",
    ai: "请你用 1 分钟介绍一下你自己，并说明为什么想做产品经理。",
    userMock:
      "面试官您好，我想应聘产品经理。我在校期间做过校园二手交易小程序，主要负责用户调研、需求分析和原型设计。我希望做产品经理，是因为我对用户需求和产品体验比较感兴趣，也希望通过产品解决真实问题。",
  },
  {
    stage: "动机追问",
    type: "motivation_followup",
    ai: "你刚才提到对产品经理感兴趣，但这个理由还比较泛。请结合你的项目说明你体现了哪些产品能力。",
    userMock:
      "在项目里，我主要体现了需求分析和原型设计能力。我们发现同学买卖二手物品时信息比较分散，所以我整理了用户痛点，把需求拆成发布、浏览、搜索和沟通几个模块，并设计了对应页面。",
  },
  {
    stage: "项目追问",
    type: "project_deep_dive",
    ai: "你简历里提到校园二手交易小程序，请介绍一下这个项目的背景、目标和你具体负责的部分。",
    userMock:
      "项目背景是校园二手交易主要依赖微信群，消息容易被刷走。目标是让同学更方便地发布和找到二手物品。我负责前期调研、需求文档和原型设计，也参与了功能优先级讨论。",
  },
  {
    stage: "数据追问",
    type: "data_followup",
    ai: "你说提升了交易效率，具体提升了多少？你们用什么指标衡量，是成交时间、匹配率，还是消息回复率？",
    userMock:
      "这块我们没有做特别完整的数据统计，主要是通过同学反馈判断效率有提升。指标方面当时更多关注发布和查找是否更方便，没有系统记录成交时间或匹配率。",
  },
  {
    stage: "贡献追问",
    type: "contribution_followup",
    ai: "我现在还是没有听到你个人不可替代的贡献。你一直在说我们团队，但我想知道，如果没有你，这个项目会有什么不同？",
    userMock:
      "如果没有我，项目可能会更偏向功能实现，而不是先验证用户需求。我推动团队先做用户访谈，并把需求拆成不同优先级，让开发同学能先做最核心的发布和浏览流程。",
  },
  {
    stage: "收尾",
    type: "closing",
    ai: "好，本轮面试先到这里。我已经记录了你在项目表达、数据意识、个人贡献和抗压回应中的表现。接下来系统会生成你的面试诊断报告。",
    userMock: "好的，谢谢面试官。",
  },
];

export const mockInterviewRecords: InterviewRecord[] =
  mockInterviewTurns.flatMap((turn, index) => [
    {
      role: "assistant",
      stage: turn.stage,
      type: turn.type,
      content: turn.ai,
      roundIndex: index + 1,
      createdAt: new Date(Date.UTC(2026, 4, 30, 9, index * 2)).toISOString(),
    },
    {
      role: "user",
      stage: turn.stage,
      type: turn.type,
      content: turn.userMock,
      roundIndex: index + 1,
      createdAt: new Date(Date.UTC(2026, 4, 30, 9, index * 2 + 1)).toISOString(),
    },
  ]);

export const mockReport: InterviewReport = {
  overallGrade: "B",
  passProbability: 58,
  eliminationRisk:
    "中等偏高。候选人具备基础产品意识，但在数据结果、个人贡献和决策依据上的表达不足，容易被压力追问击穿。",
  oneSentenceFeedback:
    "你能讲清楚项目做了什么，但还没有讲清楚为什么这么做、做得多好，以及哪些关键结果来自你。",
  dimensionScores: {
    structuredExpression: 72,
    projectDepth: 66,
    userInsight: 68,
    dataSense: 42,
    personalContribution: 55,
    pressureResistance: 61,
  },
  keyBreakpoints: [
    {
      title: "项目结果缺少量化闭环",
      impact: "面试官难以判断项目真实效果，降低对候选人产品判断力的信任。",
      evidence:
        "当被追问交易效率提升多少时，回答停留在同学反馈，没有给出成交时间、匹配率或回复率等指标。",
      suggestion:
        "补充上线前后对比指标，即使是样本数据，也要说明采集方式、样本规模和指标定义。",
    },
    {
      title: "个人贡献表达不够锋利",
      impact: "容易被认为只是参与项目，而不是推动关键产品决策的人。",
      evidence:
        "回答多次使用团队视角，直到被追问后才说明自己推动用户访谈和需求优先级拆分。",
      suggestion:
        "用“我发现、我判断、我推动、结果是”的结构呈现个人不可替代价值。",
    },
    {
      title: "产品决策依据偏弱",
      impact: "需求分析显得像常规功能罗列，而不是基于用户洞察的取舍。",
      evidence:
        "能说出发布、浏览、搜索和沟通模块，但没有解释为什么这些功能优先级最高。",
      suggestion:
        "补齐用户样本、痛点频次、场景严重程度和功能取舍理由。",
    },
  ],
  interviewerMostDissatisfied:
    "最不满意的是数据意识不足。候选人使用了“提升效率”这类结果表述，却没有准备可验证的指标口径。",
  improvedAnswer: {
    originalQuestion:
      "你说提升了交易效率，具体提升了多少？你们用什么指标衡量，是成交时间、匹配率，还是消息回复率？",
    originalIssue:
      "原回答承认没有完整统计，但没有补救性说明指标设计，也没有体现复盘能力。",
    rewriteStrategy:
      "先承认数据不足，再给出当时可获得的替代指标，最后说明如果重做会如何设计衡量体系。",
    sampleAnswer:
      "这个项目当时确实没有做到完整的数据埋点，这是我的不足。我们主要用两类弱指标判断效率：一是测试用户从发布商品到收到第一条咨询的时间，二是用户完成一次商品查找所需步骤。小范围测试里，使用小程序比微信群翻找更稳定，路径从搜索聊天记录变成分类筛选和关键词搜索。如果现在重做，我会把成交时间、商品曝光到咨询转化率、消息回复率作为核心指标，并按品类拆分，避免只用主观反馈判断效果。",
  },
  nextTrainingPlan: {
    focus: "补强项目量化表达、个人贡献归因和压力追问下的结构化回应。",
    tasks: [
      "为校园二手交易项目补一版指标口径，包括北极星指标、过程指标和验证方法。",
      "用 STAR + 产品决策依据重写项目介绍，突出个人动作和关键取舍。",
      "准备 10 个压力追问答案，重点覆盖数据缺失、贡献不清和需求优先级争议。",
    ],
  },
};
