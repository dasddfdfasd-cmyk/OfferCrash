export type CompanyStyle = "bytedance" | "tencent";

export type MeetingStatus =
  | "device_check"
  | "ai_speaking"
  | "user_answering"
  | "ai_thinking"
  | "generating_report"
  | "ended";

export interface CandidateProfile {
  targetRole: string;
  candidateSummary: string;
  education?: string;
  mainProjects: ProjectExperience[];
  overallRiskPoints: string[];
}

export interface ProjectExperience {
  projectName: string;
  background: string;
  userRole: string;
  actions: string[];
  result: string;
  riskPoints: string[];
}

export interface InterviewTurn {
  stage: string;
  type: string;
  ai: string;
  userMock: string;
}

export interface InterviewRecord {
  role: "assistant" | "user";
  stage: string;
  type: string;
  content: string;
  roundIndex: number;
  createdAt?: string;
}

export interface InterviewReport {
  overallGrade: "S" | "A" | "B" | "C" | "D";
  passProbability: number;
  eliminationRisk: string;
  oneSentenceFeedback: string;
  dimensionScores: {
    structuredExpression: number;
    projectDepth: number;
    userInsight: number;
    dataSense: number;
    personalContribution: number;
    pressureResistance: number;
  };
  keyBreakpoints: Breakpoint[];
  interviewerMostDissatisfied: string;
  improvedAnswer: {
    originalQuestion: string;
    originalIssue: string;
    rewriteStrategy: string;
    sampleAnswer: string;
  };
  nextTrainingPlan: {
    focus: string;
    tasks: string[];
  };
}

export interface Breakpoint {
  title: string;
  impact: string;
  evidence: string;
  suggestion: string;
}

export interface NextQuestionRequest {
  candidateProfile: CandidateProfile;
  companyStyle: CompanyStyle;
  interviewRecords: InterviewRecord[];
  currentStage?: string;
  roundIndex: number;
}

export interface NextQuestionResponse {
  success: boolean;
  nextQuestion: string;
  stage: string;
  type: string;
  reason: string;
  shouldEnd: boolean;
  fallback?: boolean;
  error?: string;
}
