export type CompanyStyle = 'bytedance' | 'tencent';

export type MeetingStatus =
  | 'idle'
  | 'ai_speaking'
  | 'user_answering'
  | 'ai_thinking'
  | 'generating_report'
  | 'ended';

export type InterviewStage = '开场' | '自我介绍' | '项目深挖' | '压力追问' | '收尾';

export type ServiceMode = 'voice' | 'text';

export type TranscriptRole = 'AI' | '用户' | '系统';

export type TriggerType =
  | 'opening'
  | 'resume_risk'
  | 'data'
  | 'contribution'
  | 'user_insight'
  | 'decision'
  | 'pressure'
  | 'closing';

export type CandidateProject = {
  name: string;
  background: string;
  role: string;
  result: string;
};

export type CandidateProfile = {
  role: string;
  summary: string;
  rawText: string;
  projects: CandidateProject[];
  risks: string[];
};

export type CompanyProfile = {
  short: string;
  label: string;
  meetingLabel: string;
  interviewer: string;
  title: string;
  traits: string;
  pressureLine: string;
};

export type RagHit = {
  title: string;
  content: string;
  score: number;
};

export type InterviewQuestion = {
  stage: InterviewStage;
  trigger: TriggerType;
  text: string;
  ragHits: RagHit[];
};

export type InterviewTranscriptItem = {
  id: string;
  role: TranscriptRole;
  stage: InterviewStage;
  text: string;
  time: string;
  trigger?: TriggerType;
};

export type DoubaoConfig = {
  endpoint: string;
  apiKey: string;
  model: string;
  enabled: boolean;
};

export type InterviewReport = {
  grade: string;
  passProbability: number;
  riskLevel: string;
  summary: string;
  scores: Array<{ label: string; score: number }>;
  issues: Array<{ title: string; desc: string }>;
  strongestQuestion: string;
  improvedAnswer: string;
  nextSteps: string[];
};
