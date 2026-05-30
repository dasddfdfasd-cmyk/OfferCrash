"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardList,
  Grid2X2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  Settings,
  ShieldCheck,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  X,
} from "lucide-react";

import {
  Card,
  PrimaryButton,
  SecondaryButton,
  STORAGE_KEYS,
  companyProfiles,
  getCandidateProfile,
  getCompanyStyle,
  isDemoMode,
  writeJson,
  writeText,
} from "@/components/offercrash-shared";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useRealtimeInterview } from "@/hooks/useRealtimeInterview";
import { mockCandidateProfile, mockInterviewTurns, mockReport } from "@/lib/mockData";
import type {
  CandidateProfile,
  CompanyStyle,
  InterviewRecord,
  InterviewReport,
  MeetingStatus,
} from "@/types/interview";

type ReportResponse = {
  success?: boolean;
  report?: InterviewReport;
  fallback?: boolean;
  error?: string;
};

type NextQuestionResponse = {
  success?: boolean;
  nextQuestion?: string;
  stage?: string;
  type?: string;
  reason?: string;
  shouldEnd?: boolean;
  fallback?: boolean;
  error?: string;
};

const CLOSING_QUESTION =
  "好，本轮面试先到这里。我已经记录了你的表现，接下来系统会生成面试诊断报告。";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function createAssistantRecord({
  roundIndex,
  stage,
  type,
  content,
}: {
  roundIndex: number;
  stage: string;
  type: string;
  content: string;
}): InterviewRecord {
  return {
    role: "assistant",
    stage,
    type,
    content,
    roundIndex,
    createdAt: new Date().toISOString(),
  };
}

function createUserRecord({
  roundIndex,
  stage,
  type,
  content,
}: {
  roundIndex: number;
  stage: string;
  type: string;
  content: string;
}): InterviewRecord {
  return {
    role: "user",
    stage,
    type,
    content,
    roundIndex,
    createdAt: new Date().toISOString(),
  };
}

function getMockFallbackQuestion(roundIndex: number) {
  const nextTurn = mockInterviewTurns[roundIndex + 1];

  if (!nextTurn) {
    return {
      nextQuestion: CLOSING_QUESTION,
      stage: "收尾",
      type: "closing",
      shouldEnd: true,
    };
  }

  return {
    nextQuestion: nextTurn.ai,
    stage: nextTurn.stage,
    type: nextTurn.type,
    shouldEnd: nextTurn.type === "closing",
  };
}

export default function MeetingPage() {
  const router = useRouter();
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>("device_check");
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([]);
  const [elapsedTime, setElapsedTime] = useState(77);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [interviewMode, setInterviewMode] = useState<"text" | "realtime">("text");
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [userAnswerText, setUserAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerNotice, setAnswerNotice] = useState("");
  const [currentDynamicQuestion, setCurrentDynamicQuestion] = useState("");
  const [currentDynamicStage, setCurrentDynamicStage] = useState("");
  const [currentDynamicType, setCurrentDynamicType] = useState("");
  const generatingRef = useRef(false);
  const lastSpokenQuestionRef = useRef("");
  const speechSynthesis = useSpeechSynthesis();
  const speechRecognition = useSpeechRecognition((transcript) => {
    setUserAnswerText(transcript);
    setAnswerNotice("");
  });
  const realtimeInterview = useRealtimeInterview({
    onAssistantText: ({ content, stage, followUpType }) => {
      if (!content.trim()) return;

      const nextIndex = currentTurnIndex + 1;
      const nextStage = stage || "实时追问";
      const nextType = followUpType || "realtime";
      const assistantRecord = createAssistantRecord({
        roundIndex: nextIndex,
        stage: nextStage,
        type: nextType,
        content,
      });

      setCurrentTurnIndex(nextIndex);
      setCurrentDynamicQuestion(content);
      setCurrentDynamicStage(nextStage);
      setCurrentDynamicType(nextType);
      setInterviewRecords((records) => [...records, assistantRecord]);
      setMeetingStatus("ai_speaking");
      window.setTimeout(() => setMeetingStatus("user_answering"), 1000);
    },
    onUserTranscript: ({ content, isFinal }) => {
      setUserAnswerText(content);
      if (!isFinal || !content.trim()) return;

      const userRecord = createUserRecord({
        roundIndex: currentTurnIndex,
        stage: visibleStage,
        type: visibleType,
        content,
      });
      setInterviewRecords((records) => [...records, userRecord]);
    },
    onFallback: (message) => {
      setInterviewMode("text");
      setFallbackNotice(message || "实时语音连接异常，已切换到文字面试模式。");
    },
  });

  const companyStyle = useMemo<CompanyStyle>(() => getCompanyStyle(), []);
  const selected = companyProfiles[companyStyle];
  const currentTurn = mockInterviewTurns[currentTurnIndex] ?? mockInterviewTurns.at(-1)!;
  const visibleQuestion = currentDynamicQuestion || currentTurn.ai;
  const visibleStage = currentDynamicStage || currentTurn.stage;
  const visibleType = currentDynamicType || currentTurn.type;

  useEffect(() => {
    if (meetingStatus === "device_check" || meetingStatus === "ended") return undefined;
    const timer = window.setInterval(() => setElapsedTime((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [meetingStatus]);

  useEffect(() => {
    const shouldStop =
      !ttsEnabled ||
      meetingStatus === "device_check" ||
      meetingStatus === "ai_thinking" ||
      meetingStatus === "generating_report" ||
      meetingStatus === "ended";

    if (shouldStop) {
      speechSynthesis.stop();
      if (!ttsEnabled) {
        lastSpokenQuestionRef.current = "";
      }
      return;
    }

    if (visibleQuestion && visibleQuestion !== lastSpokenQuestionRef.current) {
      lastSpokenQuestionRef.current = visibleQuestion;
      speechSynthesis.speak(visibleQuestion);
    }
  }, [meetingStatus, speechSynthesis, ttsEnabled, visibleQuestion]);

  const statusText: Record<MeetingStatus, string> = {
    device_check: "设备检查",
    ai_speaking: "AI 正在提问",
    user_answering: "用户正在回答",
    ai_thinking: "AI 正在分析",
    generating_report: "正在生成报告",
    ended: "已结束",
  };

  const generateReport = useCallback(
    async (records: InterviewRecord[]) => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      setMeetingStatus("generating_report");
      setShowEndConfirm(false);

      const candidateProfile: CandidateProfile =
        getCandidateProfile() ?? mockCandidateProfile;
      const duration = formatClock(elapsedTime);
      let report = mockReport;
      let fallback = isDemoMode();

      try {
        if (!isDemoMode()) {
          const response = await fetch("/api/report/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateProfile,
              companyStyle,
              interviewRecords: records,
              duration,
            }),
          });
          const data = (await response.json().catch(() => ({}))) as ReportResponse;

          if (!response.ok || data.success !== true) {
            throw new Error(data.error || "report generation failed");
          }

          report = data.report ?? mockReport;
          fallback = Boolean(data.fallback);
        }
      } catch (error) {
        console.error(error);
        fallback = true;
        setFallbackNotice("报告生成服务异常，已使用演示报告继续流程。");
      } finally {
        writeJson(STORAGE_KEYS.report, report);
        writeText(STORAGE_KEYS.reportFallback, fallback ? "true" : "false");
        window.setTimeout(() => router.push("/report"), fallback ? 900 : 350);
      }
    },
    [companyStyle, elapsedTime, router],
  );

  const enterMeeting = () => {
    const firstTurn = mockInterviewTurns[0];
    const firstRecord = createAssistantRecord({
      roundIndex: 0,
      stage: firstTurn.stage,
      type: firstTurn.type,
      content: firstTurn.ai,
    });

    setCurrentTurnIndex(0);
    setCurrentDynamicQuestion(firstTurn.ai);
    setCurrentDynamicStage(firstTurn.stage);
    setCurrentDynamicType(firstTurn.type);
    setUserAnswerText("");
    setAnswerNotice("");
    setFallbackNotice("");
    setInterviewRecords([firstRecord]);
    setMeetingStatus("ai_speaking");
    window.setTimeout(() => setMeetingStatus("user_answering"), 1000);
  };

  const appendClosingAndGenerate = useCallback(
    (records: InterviewRecord[], roundIndex: number) => {
      const closingRecord = createAssistantRecord({
        roundIndex,
        stage: "收尾",
        type: "closing",
        content: CLOSING_QUESTION,
      });
      const finalRecords = [...records, closingRecord];

      setCurrentDynamicQuestion(CLOSING_QUESTION);
      setCurrentDynamicStage("收尾");
      setCurrentDynamicType("closing");
      setInterviewRecords(finalRecords);
      setMeetingStatus("generating_report");
      generateReport(finalRecords);
    },
    [generateReport],
  );

  const submitAnswer = async () => {
    if (meetingStatus !== "user_answering" || isSubmittingAnswer) return;

    const trimmedAnswer = userAnswerText.trim();
    if (!trimmedAnswer) {
      setAnswerNotice("请先输入回答内容。");
      return;
    }

    setIsSubmittingAnswer(true);
    setAnswerNotice("");
    setFallbackNotice("");
    speechRecognition.stop();

    const userRecord = createUserRecord({
      roundIndex: currentTurnIndex,
      stage: visibleStage,
      type: visibleType,
      content: trimmedAnswer,
    });
    const recordsWithUserAnswer = [...interviewRecords, userRecord];

    setInterviewRecords(recordsWithUserAnswer);
    setUserAnswerText("");
    setMeetingStatus("ai_thinking");

    if (currentTurnIndex >= 7) {
      setIsSubmittingAnswer(false);
      appendClosingAndGenerate(recordsWithUserAnswer, currentTurnIndex + 1);
      return;
    }

    try {
      const candidateProfile = getCandidateProfile() ?? mockCandidateProfile;
      const response = await fetch("/api/interview/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateProfile,
          companyStyle,
          interviewRecords: recordsWithUserAnswer,
          currentStage: visibleStage,
          roundIndex: currentTurnIndex,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as NextQuestionResponse;

      if (!response.ok || data.success !== true || !data.nextQuestion) {
        throw new Error(data.error || "next question failed");
      }

      const nextIndex = currentTurnIndex + 1;
      const nextStage = data.stage || "追问";
      const nextType = data.type || "followup";
      const assistantRecord = createAssistantRecord({
        roundIndex: nextIndex,
        stage: nextStage,
        type: nextType,
        content: data.nextQuestion,
      });
      const recordsWithAssistant = [...recordsWithUserAnswer, assistantRecord];

      setCurrentTurnIndex(nextIndex);
      setCurrentDynamicQuestion(data.nextQuestion);
      setCurrentDynamicStage(nextStage);
      setCurrentDynamicType(nextType);
      setInterviewRecords(recordsWithAssistant);

      if (data.shouldEnd) {
        setIsSubmittingAnswer(false);
        setMeetingStatus("generating_report");
        generateReport(recordsWithAssistant);
        return;
      }

      setMeetingStatus("ai_speaking");
      setIsSubmittingAnswer(false);
      window.setTimeout(() => setMeetingStatus("user_answering"), 1000);
    } catch (error) {
      console.error(error);
      const fallback = getMockFallbackQuestion(currentTurnIndex);
      const nextIndex = currentTurnIndex + 1;
      const assistantRecord = createAssistantRecord({
        roundIndex: nextIndex,
        stage: fallback.stage,
        type: fallback.type,
        content: fallback.nextQuestion,
      });
      const recordsWithFallback = [...recordsWithUserAnswer, assistantRecord];

      setFallbackNotice("动态追问服务异常，已切换到演示追问。");
      setCurrentTurnIndex(nextIndex);
      setCurrentDynamicQuestion(fallback.nextQuestion);
      setCurrentDynamicStage(fallback.stage);
      setCurrentDynamicType(fallback.type);
      setInterviewRecords(recordsWithFallback);
      setIsSubmittingAnswer(false);

      if (fallback.shouldEnd) {
        setMeetingStatus("generating_report");
        generateReport(recordsWithFallback);
        return;
      }

      setMeetingStatus("ai_speaking");
      window.setTimeout(() => setMeetingStatus("user_answering"), 1000);
    }
  };

  const fillExampleAnswer = () => {
    setUserAnswerText(currentTurn.userMock);
    setAnswerNotice("");
  };

  const startVoiceAnswer = () => {
    setAnswerNotice("");
    speechRecognition.start();
  };

  const startRealtimeMode = () => {
    setFallbackNotice("");
    setInterviewMode("realtime");
    realtimeInterview.startRealtime({
      sessionId: crypto.randomUUID(),
      companyStyle,
      candidateProfile: getCandidateProfile() ?? mockCandidateProfile,
      interviewRecords,
    });
  };

  const stopRealtimeMode = () => {
    realtimeInterview.stopRealtime();
    setInterviewMode("text");
    setFallbackNotice("已切换到文字面试模式。");
  };

  const questionText =
    meetingStatus === "ai_thinking"
      ? "AI 正在分析你的回答..."
      : meetingStatus === "generating_report"
        ? "正在生成面试诊断报告..."
        : visibleQuestion;

  return (
    <main className="oc-meeting">
      <header className="oc-meeting-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span className="oc-logo" style={{ width: 30, height: 30, borderRadius: 8 }}>
            <MonitorUp size={17} />
          </span>
          <strong>会议详情</strong>
          <span className="oc-muted">{formatClock(elapsedTime)}</span>
          <span className="oc-muted">
            产品经理压力面试会议室 | {selected.meetingLabel}
          </span>
          <Wifi size={17} color="#10b981" />
          <ShieldCheck size={17} color="#2563eb" />
          <Volume2 size={17} color="#6b7280" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TopTool icon={<Grid2X2 size={16} />} label="宫格布局" />
          <TopTool icon={<ShieldCheck size={16} />} label="主持人工具" />
          <TopTool icon={<Settings size={16} />} label="设置" />
        </div>
      </header>

      <div className="oc-meeting-body">
        <section className="oc-canvas">
          <div className="oc-question">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="oc-logo" style={{ width: 28, height: 28, borderRadius: 8 }}>
                <MessageSquare size={15} />
              </span>
              <strong>当前问题</strong>
              <span className="oc-tag">{visibleType}</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #dbeafe",
                borderRadius: 999,
                background: "#eff6ff",
                padding: 4,
                width: "fit-content",
              }}
            >
              <button
                className={interviewMode === "text" ? "oc-primary" : "oc-secondary"}
                onClick={stopRealtimeMode}
                style={{ minHeight: 32, padding: "0 12px", boxShadow: "none" }}
              >
                文字面试模式
              </button>
              <button
                className={interviewMode === "realtime" ? "oc-primary" : "oc-secondary"}
                disabled={realtimeInterview.isConnecting}
                onClick={startRealtimeMode}
                style={{ minHeight: 32, padding: "0 12px", boxShadow: "none" }}
              >
                {realtimeInterview.isConnecting ? "连接中" : "实时语音模式"}
              </button>
              <span className="oc-muted" style={{ fontSize: 12, padding: "0 8px" }}>
                {realtimeInterview.statusText}
              </span>
            </div>
            <p style={{ color: "#111827", lineHeight: 1.8, fontWeight: 700 }}>
              {questionText}
            </p>
          </div>

          <div className="oc-members">
            <MeetingMember
              active={meetingStatus === "ai_speaking"}
              name="David"
              role="AI 面试官"
              status={
                meetingStatus === "ai_speaking"
                  ? "正在提问"
                  : meetingStatus === "ai_thinking"
                    ? "正在分析"
                    : selected.interviewer
              }
            />
            <MeetingMember
              active={meetingStatus === "user_answering"}
              candidate
              name="我是谁"
              role="候选人 / 你"
              status={meetingStatus === "user_answering" ? "正在回答" : "等待回答"}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              background: "#fff",
              padding: "8px 14px",
              color: "#6b7280",
              boxShadow: "0 8px 20px rgba(17,24,39,.06)",
            }}
          >
            {statusText[meetingStatus]} · 第 {currentTurnIndex + 1}/8 轮
          </div>
          {fallbackNotice && (
            <div
              className="oc-alert"
              style={{
                position: "absolute",
                bottom: 74,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {fallbackNotice}
            </div>
          )}
        </section>

        <aside className="oc-record-panel">
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #e5e7eb",
              padding: "0 20px",
            }}
          >
            <strong
              style={{ color: "#111827", display: "flex", alignItems: "center", gap: 8 }}
            >
              <ClipboardList size={20} />
              面试实时记录
            </strong>
            <X size={18} color="#6b7280" />
          </div>
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              background: "#f4f7ff",
              color: "#2563eb",
              padding: "12px 20px",
            }}
          >
            面试开始 {formatClock(77)}
          </div>
          <div className="oc-record-list">
            {interviewRecords.length === 0 && (
              <p className="oc-muted">
                进入面试后，AI 会主动开场并生成记录。
              </p>
            )}
            {interviewRecords.map((record, index) => (
              <article className="oc-record" key={`${record.role}-${record.roundIndex}-${index}`}>
                <span className={`oc-record-dot ${record.role === "user" ? "is-user" : ""}`} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ color: record.role === "user" ? "#059669" : "#2563eb" }}>
                    {record.role === "user" ? "你" : "AI"}
                  </strong>
                  <span className="oc-tag">
                    {record.stage} · {record.type}
                  </span>
                </div>
                <p style={{ lineHeight: 1.8 }}>{record.content}</p>
              </article>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e5e7eb", padding: 14 }}>
            <div
              style={{
                display: "grid",
                gap: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#f9fafb",
                padding: 12,
              }}
            >
              <textarea
                value={userAnswerText}
                disabled={meetingStatus !== "user_answering" || isSubmittingAnswer}
                placeholder="请输入你的回答，或使用示例回答快速体验。"
                onChange={(event) => {
                  setUserAnswerText(event.target.value);
                  if (answerNotice) setAnswerNotice("");
                }}
                style={{
                  minHeight: 92,
                  resize: "vertical",
                  border: "1px solid #dde7f8",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#111827",
                  outline: "none",
                  padding: "10px 12px",
                  lineHeight: 1.6,
                }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <button
                  className="oc-secondary"
                  disabled={meetingStatus !== "user_answering" || isSubmittingAnswer}
                  onClick={fillExampleAnswer}
                  style={{ minHeight: 38, padding: "0 12px" }}
                >
                  使用示例回答
                </button>
                <button
                  className="oc-primary"
                  disabled={meetingStatus !== "user_answering" || isSubmittingAnswer}
                  onClick={submitAnswer}
                  style={{ minHeight: 38, padding: "0 12px" }}
                >
                  <Send size={16} />
                  提交回答
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <button
                  className="oc-secondary"
                  disabled={
                    meetingStatus !== "user_answering" ||
                    isSubmittingAnswer ||
                    speechRecognition.isListening
                  }
                  onClick={startVoiceAnswer}
                  style={{ minHeight: 36, padding: "0 12px" }}
                >
                  <Mic size={15} />
                  开始语音回答
                </button>
                <button
                  className="oc-secondary"
                  disabled={!speechRecognition.isListening}
                  onClick={speechRecognition.stop}
                  style={{ minHeight: 36, padding: "0 12px" }}
                >
                  <MicOff size={15} />
                  停止识别
                </button>
              </div>
            </div>
            {answerNotice && (
              <p style={{ color: "#b91c1c", fontSize: 12, fontWeight: 700, margin: "8px 0 0" }}>
                {answerNotice}
              </p>
            )}
            {!speechRecognition.isSupported && (
              <p style={{ color: "#b45309", fontSize: 12, fontWeight: 700, margin: "8px 0 0" }}>
                当前浏览器不支持语音识别，请使用文字输入回答。
              </p>
            )}
            {speechRecognition.error && (
              <p style={{ color: "#b91c1c", fontSize: 12, fontWeight: 700, margin: "8px 0 0" }}>
                {speechRecognition.error}
              </p>
            )}
            {speechRecognition.isListening && (
              <p style={{ color: "#2563eb", fontSize: 12, fontWeight: 700, margin: "8px 0 0" }}>
                正在识别语音，识别结果会实时写入回答框。
              </p>
            )}
            <p className="oc-muted" style={{ fontSize: 12 }}>
              实时记录将用于面试评估，请如实作答。
            </p>
          </div>
        </aside>
      </div>

      <footer className="oc-meeting-bottom">
        <div style={{ display: "flex", justifyContent: "flex-start", gap: 8 }}>
          <ControlButton
            danger={isMuted}
            icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            label={isMuted ? "解除静音" : "静音"}
            onClick={() => setIsMuted((value) => !value)}
          />
          <ControlButton
            icon={isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
            label={isVideoOn ? "关闭视频" : "开启视频"}
            onClick={() => setIsVideoOn((value) => !value)}
          />
          <ControlButton
            icon={<Volume2 size={22} />}
            label={ttsEnabled ? "AI 语音播报：开" : "AI 语音播报：关"}
            onClick={() => setTtsEnabled((value) => !value)}
          />
        </div>
        <button
          className="oc-primary"
          disabled={meetingStatus !== "user_answering" || isSubmittingAnswer}
          onClick={submitAnswer}
          style={
            meetingStatus !== "user_answering" || isSubmittingAnswer
              ? {
                  borderColor: "#f3f4f6",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  boxShadow: "none",
                }
              : undefined
          }
        >
          提交回答
        </button>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="oc-control oc-end" onClick={() => setShowEndConfirm(true)}>
            <PhoneOff size={22} />
            <span>结束会议</span>
          </button>
        </div>
      </footer>

      {meetingStatus === "device_check" && <DeviceModal onEnter={enterMeeting} />}
      {showEndConfirm && (
        <ConfirmModal
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={() => generateReport(interviewRecords)}
        />
      )}
    </main>
  );
}

function TopTool({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        border: 0,
        borderRadius: 8,
        background: "transparent",
        padding: "7px 9px",
        color: "#6b7280",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MeetingMember({
  name,
  role,
  active,
  status,
  candidate,
}: {
  name: string;
  role: string;
  active: boolean;
  status: string;
  candidate?: boolean;
}) {
  return (
    <div className="oc-member">
      <div className={`oc-avatar ${active ? "is-active" : ""} ${candidate ? "oc-avatar-candidate" : ""}`}>
        {candidate ? (
          <strong>我</strong>
        ) : (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              background: "linear-gradient(#f9fafb,#e5e7eb)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 36,
                top: 20,
                width: 28,
                height: 36,
                borderRadius: "999px 999px 12px 12px",
                background: "#f3d4c4",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 28,
                bottom: 0,
                width: 42,
                height: 42,
                borderRadius: "18px 18px 0 0",
                background: "#1f2937",
              }}
            />
          </div>
        )}
      </div>
      <p style={{ color: "#111827", fontWeight: 800 }}>{name}</p>
      <p className="oc-muted" style={{ fontSize: 12 }}>
        {role}
      </p>
      <p className={active ? "oc-tag" : "oc-muted"} style={{ display: "inline-flex", marginTop: 4 }}>
        {status}
      </p>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button className="oc-control" onClick={onClick} style={danger ? { color: "#ef4444" } : undefined}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DeviceModal({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="oc-modal-backdrop">
      <Card className="oc-modal">
        <h2 style={{ color: "#111827", fontSize: 26 }}>
          进入面试前，请确认设备状态
        </h2>
        {["麦克风：已连接", "语音服务：已连接", "简历档案：已读取"].map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 14,
              background: "#eff6ff",
              padding: 14,
              marginTop: 12,
            }}
          >
            <Check size={18} color="#2563eb" />
            <strong style={{ color: "#111827" }}>{item}</strong>
          </div>
        ))}
        <div className="oc-actions">
          <SecondaryButton icon={<Volume2 size={18} />}>测试麦克风</SecondaryButton>
          <PrimaryButton icon={<MonitorUp size={18} />} onClick={onEnter}>
            进入面试
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="oc-modal-backdrop">
      <Card className="oc-modal">
        <h2 style={{ color: "#111827" }}>
          确定结束本轮面试并生成诊断报告吗？
        </h2>
        <div className="oc-actions">
          <SecondaryButton onClick={onCancel}>继续面试</SecondaryButton>
          <PrimaryButton icon={<ClipboardList size={18} />} onClick={onConfirm}>
            生成报告
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
