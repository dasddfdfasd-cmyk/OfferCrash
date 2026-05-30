"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  ClipboardList,
  Grid2X2,
  Keyboard,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  SkipForward,
  Volume2,
  Wifi,
  X,
} from "lucide-react";

import {
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
import { getLocalFallbackQuestion } from "@/lib/fallbackQuestion";
import { mockCandidateProfile, mockInterviewTurns, mockReport } from "@/lib/mockData";
import type {
  CandidateProfile,
  CompanyStyle,
  InterviewRecord,
  InterviewReport,
} from "@/types/interview";

type VoiceMeetingStatus =
  | "device_check"
  | "ai_speaking"
  | "waiting_user"
  | "user_speaking"
  | "silence_detecting"
  | "ai_thinking"
  | "generating_report"
  | "ended";

type InterviewMode = "voice" | "text";
type DeviceCheckStatus = "checking" | "available" | "unsupported" | "unauthorized";
type DeviceCheckSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: (() => void) | null;
  abort: () => void;
  start: () => void;
};

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

const SOFT_SILENCE_TIMEOUT_MS = 1800;
const FINAL_SILENCE_TIMEOUT_MS = 3200;
const LONG_ANSWER_FINAL_SILENCE_MS = 2200;
const MIN_ANSWER_LENGTH = 12;
const LONG_ANSWER_LENGTH = 80;
const NO_SPEECH_HINT_MS = 15000;
const MAX_ANSWER_DURATION_MS = 90000;
const MAX_ROUNDS = 8;
const NEXT_QUESTION_TIMEOUT_MS = 6000;
const THINKING_STEPS = [
  "正在提取你的回答重点...",
  "正在匹配面试官追问策略...",
  "正在生成下一轮压力追问...",
];
const TRANSITION_PHRASES: Record<CompanyStyle, string[]> = {
  bytedance: [
    "好，我追问一个更具体的问题。",
    "我先看一下你回答里的数据和个人贡献。",
    "这个回答还可以继续往下追。",
  ],
  tencent: [
    "好，我想继续确认一下这个用户场景。",
    "我先理解一下你刚才的表达。",
    "这里我会追问一下需求判断依据。",
  ],
};

const CLOSING_QUESTION =
  "好，本轮面试先到这里。我已经记录了你的表现，接下来系统会生成面试诊断报告。";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function createRecord(params: {
  role: "assistant" | "user";
  stage: string;
  type: string;
  content: string;
  roundIndex: number;
}): InterviewRecord {
  return {
    ...params,
    createdAt: new Date().toISOString(),
  };
}

function getFallbackQuestion(roundIndex: number) {
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

function getDeviceStatusText(status: DeviceCheckStatus) {
  if (status === "checking") return "检测中";
  if (status === "available") return "可用";
  if (status === "unauthorized") return "未授权";
  return "不支持";
}

function isDeviceStatusOk(status: DeviceCheckStatus) {
  return status === "available";
}

function getTransitionPhrase(companyStyle: CompanyStyle) {
  const phrases = TRANSITION_PHRASES[companyStyle] ?? TRANSITION_PHRASES.bytedance;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export default function MeetingPage() {
  const router = useRouter();
  const speechRecognition = useSpeechRecognition();
  const speechSynthesis = useSpeechSynthesis();

  const [answerNotice, setAnswerNotice] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(mockInterviewTurns[0]?.ai ?? "");
  const [currentStage, setCurrentStage] = useState(mockInterviewTurns[0]?.stage ?? "开场");
  const [currentType, setCurrentType] = useState(mockInterviewTurns[0]?.type ?? "opening");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentUserTranscript, setCurrentUserTranscript] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("voice");
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState<VoiceMeetingStatus>("device_check");
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);

  const companyStyle = useMemo<CompanyStyle>(() => getCompanyStyle(), []);
  const selectedCompany = companyProfiles[companyStyle];
  const candidateProfile = useMemo<CandidateProfile>(
    () => getCandidateProfile() ?? mockCandidateProfile,
    [],
  );

  const currentQuestionRef = useRef(currentQuestion);
  const currentStageRef = useRef(currentStage);
  const currentTranscriptRef = useRef("");
  const currentTurnIndexRef = useRef(currentTurnIndex);
  const currentTypeRef = useRef(currentType);
  const finalizingRef = useRef(false);
  const generatingRef = useRef(false);
  const interviewModeRef = useRef(interviewMode);
  const interviewRecordsRef = useRef<InterviewRecord[]>([]);
  const meetingStatusRef = useRef<VoiceMeetingStatus>(meetingStatus);
  const noSpeechTimerRef = useRef<number | null>(null);
  const maxAnswerTimerRef = useRef<number | null>(null);
  const softSilenceTimerRef = useRef<number | null>(null);
  const finalSilenceTimerRef = useRef<number | null>(null);
  const speechEndFallbackTimerRef = useRef<number | null>(null);
  const thinkingStepTimerRef = useRef<number | null>(null);
  const lastSpokenQuestionRef = useRef("");
  const speechRecognitionRef = useRef(speechRecognition);
  const speechSynthesisRef = useRef(speechSynthesis);

  const clearAnswerTimers = useCallback(() => {
    for (const timerRef of [
      noSpeechTimerRef,
      maxAnswerTimerRef,
      softSilenceTimerRef,
      finalSilenceTimerRef,
      speechEndFallbackTimerRef,
      thinkingStepTimerRef,
    ]) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    currentStageRef.current = currentStage;
  }, [currentStage]);

  useEffect(() => {
    currentTypeRef.current = currentType;
  }, [currentType]);

  useEffect(() => {
    currentTurnIndexRef.current = currentTurnIndex;
  }, [currentTurnIndex]);

  useEffect(() => {
    currentTranscriptRef.current = currentUserTranscript;
  }, [currentUserTranscript]);

  useEffect(() => {
    interviewModeRef.current = interviewMode;
  }, [interviewMode]);

  useEffect(() => {
    meetingStatusRef.current = meetingStatus;
  }, [meetingStatus]);

  useEffect(() => {
    interviewRecordsRef.current = interviewRecords;
  }, [interviewRecords]);

  useEffect(() => {
    if (thinkingStepTimerRef.current !== null) {
      window.clearInterval(thinkingStepTimerRef.current);
      thinkingStepTimerRef.current = null;
    }

    if (meetingStatus !== "ai_thinking") {
      setThinkingStepIndex(0);
      return undefined;
    }

    setThinkingStepIndex(0);
    thinkingStepTimerRef.current = window.setInterval(() => {
      setThinkingStepIndex((index) => (index + 1) % THINKING_STEPS.length);
    }, 800);

    return () => {
      if (thinkingStepTimerRef.current !== null) {
        window.clearInterval(thinkingStepTimerRef.current);
        thinkingStepTimerRef.current = null;
      }
    };
  }, [meetingStatus]);

  useEffect(() => {
    speechRecognitionRef.current = speechRecognition;
  }, [speechRecognition]);

  useEffect(() => {
    speechSynthesisRef.current = speechSynthesis;
  }, [speechSynthesis]);

  useEffect(() => {
    if (meetingStatus === "device_check" || meetingStatus === "ended") return undefined;
    const timer = window.setInterval(() => {
      setElapsedTime((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [meetingStatus]);

  const switchToTextMode = useCallback(
    (message = "语音能力不可用，已切换到文字面试模式，不影响体验流程。") => {
      clearAnswerTimers();
      speechRecognition.stopListening();
      speechSynthesis.cancel();
      setInterviewMode("text");
      setAnswerNotice(message);
      setMeetingStatus((status) =>
        status === "device_check" || status === "generating_report" || status === "ended"
          ? status
          : "waiting_user",
      );
    },
    [clearAnswerTimers, speechRecognition, speechSynthesis],
  );

  const generateReport = useCallback(
    async (records: InterviewRecord[]) => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      clearAnswerTimers();
      speechRecognition.stopListening();
      speechSynthesis.cancel();
      setShowEndConfirm(false);
      setMeetingStatus("generating_report");

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
              duration: formatClock(elapsedTime),
              interviewRecords: records,
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
        setAnswerNotice("报告生成服务异常，已使用演示报告继续流程。");
      } finally {
        writeJson(STORAGE_KEYS.report, report);
        writeText(STORAGE_KEYS.reportFallback, fallback ? "true" : "false");
        window.setTimeout(() => router.push("/report"), fallback ? 900 : 350);
      }
    },
    [
      candidateProfile,
      clearAnswerTimers,
      companyStyle,
      elapsedTime,
      router,
      speechRecognition,
      speechSynthesis,
    ],
  );

  const startListeningForAnswer = useCallback(
    (reset = true) => {
      clearAnswerTimers();
      finalizingRef.current = false;
      if (reset) {
        speechRecognition.resetTranscript();
        currentTranscriptRef.current = "";
        setCurrentUserTranscript("");
      }

      if (interviewModeRef.current !== "voice") {
        setMeetingStatus("waiting_user");
        return;
      }

      setAnswerNotice("");
      setMeetingStatus("waiting_user");
      const started = speechRecognition.startListening();
      if (!started) {
        switchToTextMode();
        return;
      }

      noSpeechTimerRef.current = window.setTimeout(() => {
        if (!currentTranscriptRef.current.trim() && meetingStatusRef.current === "waiting_user") {
          setAnswerNotice("你可以开始回答了，系统会自动识别你的语音。");
        }
      }, NO_SPEECH_HINT_MS);

      maxAnswerTimerRef.current = window.setTimeout(() => {
        const answer = currentTranscriptRef.current.trim();
        if (answer.length >= MIN_ANSWER_LENGTH) {
          void finalizeUserAnswer(answer);
        } else {
          setAnswerNotice("未检测到有效回答，请继续回答或切换文字模式。");
        }
      }, MAX_ANSWER_DURATION_MS);
    },
    [clearAnswerTimers, speechRecognition, switchToTextMode],
  );

  const speakQuestion = useCallback(
    (questionText: string, force = false) => {
      clearAnswerTimers();
      speechRecognition.stopListening();

      if (interviewModeRef.current !== "voice") {
        setMeetingStatus("waiting_user");
        return;
      }

      if (!force && lastSpokenQuestionRef.current === questionText) {
        return;
      }
      lastSpokenQuestionRef.current = questionText;

      if (speechEndFallbackTimerRef.current !== null) {
        window.clearTimeout(speechEndFallbackTimerRef.current);
      }
      speechEndFallbackTimerRef.current = window.setTimeout(
        () => {
          if (
            interviewModeRef.current === "voice" &&
            meetingStatusRef.current === "ai_speaking" &&
            lastSpokenQuestionRef.current === questionText
          ) {
            setAnswerNotice("AI 播报已结束，请开始回答。");
            startListeningForAnswer();
          }
        },
        Math.max(2600, Math.min(12000, questionText.length * 180)),
      );

      speechSynthesis.speak(questionText, {
        rate: 1.08,
        pitch: 1,
        voiceURI: selectedVoiceURI || undefined,
        onStart: () => {
          setMeetingStatus("ai_speaking");
        },
        onEnd: () => {
          if (speechEndFallbackTimerRef.current !== null) {
            window.clearTimeout(speechEndFallbackTimerRef.current);
            speechEndFallbackTimerRef.current = null;
          }
          if (interviewModeRef.current === "voice" && meetingStatusRef.current !== "ended") {
            startListeningForAnswer();
          }
        },
        onError: () => {
          setAnswerNotice("AI 语音播报异常，已显示文字问题并继续面试。");
        },
      });
    },
    [clearAnswerTimers, selectedVoiceURI, speechRecognition, speechSynthesis, startListeningForAnswer],
  );

  useEffect(() => {
    if (interviewMode !== "voice" || meetingStatus !== "ai_speaking") return;
    if (!currentQuestion) return;
    speakQuestion(currentQuestion);
  }, [currentQuestion, interviewMode, meetingStatus, speakQuestion]);

  const speakThinkingTransition = useCallback(() => {
    if (interviewModeRef.current !== "voice") return;
    speechSynthesis.speak(getTransitionPhrase(companyStyle), {
      rate: 1.08,
      pitch: 1,
      voiceURI: selectedVoiceURI || undefined,
    });
  }, [companyStyle, selectedVoiceURI, speechSynthesis]);

  const generateNextQuestion = useCallback(
    async (records: InterviewRecord[]) => {
      const roundIndex = currentTurnIndexRef.current;
      if (roundIndex >= MAX_ROUNDS - 1) {
        await generateReport(records);
        return;
      }

      setMeetingStatus("ai_thinking");
      let timeout: number | null = null;
      try {
        const controller = new AbortController();
        timeout = window.setTimeout(() => controller.abort(), NEXT_QUESTION_TIMEOUT_MS);
        const response = await fetch("/api/interview/next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            candidateProfile,
            companyStyle,
            currentStage: currentStageRef.current,
            interviewRecords: records,
            roundIndex,
            voiceMode: interviewModeRef.current === "voice",
          }),
        });
        if (timeout !== null) {
          window.clearTimeout(timeout);
          timeout = null;
        }
        const data = (await response.json().catch(() => ({}))) as NextQuestionResponse;
        if (!response.ok || data.success !== true || !data.nextQuestion) {
          throw new Error(data.error || "next question failed");
        }

        const nextIndex = roundIndex + 1;
        const nextStage = data.stage || "追问";
        const nextType = data.type || "followup";
        const assistantRecord = createRecord({
          role: "assistant",
          stage: nextStage,
          type: nextType,
          content: data.nextQuestion,
          roundIndex: nextIndex,
        });
        const nextRecords = [...records, assistantRecord];
        setInterviewRecords(nextRecords);
        setCurrentTurnIndex(nextIndex);
      setCurrentQuestion(data.nextQuestion);
      setCurrentStage(nextStage);
      setCurrentType(nextType);

        if (data.shouldEnd) {
          await generateReport(nextRecords);
          return;
        }

        setMeetingStatus("ai_speaking");
      } catch (error) {
        if (timeout !== null) {
          window.clearTimeout(timeout);
          timeout = null;
        }
        console.error(error);
        const isTimeout = error instanceof DOMException && error.name === "AbortError";
        const lastUserAnswer =
          [...records].reverse().find((record) => record.role === "user")?.content ?? "";
        const fallback = getLocalFallbackQuestion({
          candidateProfile,
          companyStyle,
          lastUserAnswer,
          roundIndex,
        });
        const nextIndex = roundIndex + 1;
        const assistantRecord = createRecord({
          role: "assistant",
          stage: fallback.stage,
          type: fallback.type,
          content: fallback.nextQuestion,
          roundIndex: nextIndex,
        });
        const fallbackRecords = [...records, assistantRecord];
        setAnswerNotice(
          isTimeout
            ? "AI 响应较慢，已使用快速追问继续面试。"
            : "动态追问服务异常，已切换到演示追问。",
        );
        setInterviewRecords(fallbackRecords);
        setCurrentTurnIndex(nextIndex);
        setCurrentQuestion(fallback.nextQuestion);
        setCurrentStage(fallback.stage);
        setCurrentType(fallback.type);

        if (fallback.shouldEnd) {
          await generateReport(fallbackRecords);
          return;
        }

        setMeetingStatus("ai_speaking");
      }
    },
    [candidateProfile, companyStyle, generateReport, speakQuestion],
  );

  const finalizeUserAnswer = useCallback(
    async (answerText: string) => {
      if (finalizingRef.current) return;
      const answer = answerText.trim();

      if (answer.length < MIN_ANSWER_LENGTH) {
        setMeetingStatus("waiting_user");
        setAnswerNotice("回答内容较短，可以继续补充。");
        if (interviewModeRef.current === "voice") {
          speechRecognition.startListening();
        }
        return;
      }

      finalizingRef.current = true;
      clearAnswerTimers();
      speechRecognition.stopListening();

      const userRecord = createRecord({
        role: "user",
        stage: currentStageRef.current,
        type: currentTypeRef.current,
        content: answer,
        roundIndex: currentTurnIndexRef.current,
      });
      const nextRecords = [...interviewRecordsRef.current, userRecord];
      setInterviewRecords(nextRecords);
      setCurrentUserTranscript("");
      currentTranscriptRef.current = "";
      speechRecognition.resetTranscript();
      setMeetingStatus("ai_thinking");
      setAnswerNotice("");
      speakThinkingTransition();

      await generateNextQuestion(nextRecords);
    },
    [clearAnswerTimers, generateNextQuestion, speakThinkingTransition, speechRecognition],
  );

  const submitManualAnswer = useCallback(
    async (answerText: string) => {
      if (finalizingRef.current) return;
      const answer = answerText.trim();
      if (!answer) {
        setAnswerNotice("请输入回答内容。");
        return;
      }

      finalizingRef.current = true;
      clearAnswerTimers();
      speechRecognition.stopListening();

      const userRecord = createRecord({
        role: "user",
        stage: currentStageRef.current,
        type: currentTypeRef.current,
        content: answer,
        roundIndex: currentTurnIndexRef.current,
      });
      const nextRecords = [...interviewRecordsRef.current, userRecord];
      setInterviewRecords(nextRecords);
      setCurrentUserTranscript("");
      currentTranscriptRef.current = "";
      speechRecognition.resetTranscript();
      setMeetingStatus("ai_thinking");
      setAnswerNotice("");
      speakThinkingTransition();

      await generateNextQuestion(nextRecords);
    },
    [clearAnswerTimers, generateNextQuestion, speakThinkingTransition, speechRecognition],
  );

  useEffect(() => {
    if (
      interviewMode !== "voice" ||
      !["waiting_user", "user_speaking", "silence_detecting"].includes(meetingStatus)
    ) {
      return;
    }

    const transcript = speechRecognition.transcript.trim();
    if (transcript === currentTranscriptRef.current) return;

    currentTranscriptRef.current = transcript;
    setCurrentUserTranscript(transcript);
    if (noSpeechTimerRef.current !== null) {
      window.clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
    if (softSilenceTimerRef.current !== null) {
      window.clearTimeout(softSilenceTimerRef.current);
    }
    if (finalSilenceTimerRef.current !== null) {
      window.clearTimeout(finalSilenceTimerRef.current);
    }

    if (transcript.length > 0) {
      setMeetingStatus("user_speaking");
      setAnswerNotice("");
    }

    if (transcript.length < MIN_ANSWER_LENGTH) {
      setAnswerNotice("可以继续补充回答。");
      return;
    }

    softSilenceTimerRef.current = window.setTimeout(() => {
      if (!finalizingRef.current && currentTranscriptRef.current.trim() === transcript) {
        setMeetingStatus("silence_detecting");
        setAnswerNotice("检测到停顿，正在判断是否回答完毕...");
      }
    }, SOFT_SILENCE_TIMEOUT_MS);

    const finalDelay =
      transcript.length >= LONG_ANSWER_LENGTH
        ? LONG_ANSWER_FINAL_SILENCE_MS
        : FINAL_SILENCE_TIMEOUT_MS;
    finalSilenceTimerRef.current = window.setTimeout(() => {
      if (!finalizingRef.current && currentTranscriptRef.current.trim() === transcript) {
        void finalizeUserAnswer(transcript);
      }
    }, finalDelay);
  }, [finalizeUserAnswer, interviewMode, meetingStatus, speechRecognition.transcript]);

  useEffect(() => {
    if (
      interviewMode === "voice" &&
      !speechRecognition.isListening &&
      !finalizingRef.current &&
      ["waiting_user", "user_speaking", "silence_detecting"].includes(meetingStatus) &&
      !speechRecognition.error
    ) {
      const timer = window.setTimeout(() => {
        if (interviewModeRef.current === "voice" && !speechRecognition.isListening) {
          speechRecognition.startListening();
        }
      }, 350);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [
    interviewMode,
    meetingStatus,
    speechRecognition.error,
    speechRecognition.isListening,
    speechRecognition,
  ]);

  useEffect(() => {
    if (speechRecognition.error && interviewMode === "voice") {
      switchToTextMode(speechRecognition.error || "语音能力不可用，已切换到文字面试模式，不影响体验流程。");
    }
  }, [interviewMode, speechRecognition.error, switchToTextMode]);

  useEffect(() => {
    return () => {
      clearAnswerTimers();
      speechRecognitionRef.current.stopListening();
      speechSynthesisRef.current.cancel();
    };
  }, [clearAnswerTimers]);

  const initializeInterview = useCallback(
    (mode: InterviewMode) => {
      const firstTurn = mockInterviewTurns[0];
      if (!firstTurn) return;

      clearAnswerTimers();
      generatingRef.current = false;
      finalizingRef.current = false;
      speechRecognition.stopListening();
      speechSynthesis.cancel();
      speechRecognition.resetTranscript();

      const firstRecord = createRecord({
        role: "assistant",
        stage: firstTurn.stage,
        type: firstTurn.type,
        content: firstTurn.ai,
        roundIndex: 0,
      });

      setElapsedTime(0);
      setInterviewMode(mode);
      setCurrentTurnIndex(0);
      setCurrentStage(firstTurn.stage);
      setCurrentType(firstTurn.type);
      setCurrentQuestion(firstTurn.ai);
      setCurrentUserTranscript("");
      setTextAnswer("");
      setAnswerNotice("");
      setInterviewRecords([firstRecord]);

      if (mode === "voice") {
        interviewModeRef.current = "voice";
        lastSpokenQuestionRef.current = "";
        setMeetingStatus("ai_speaking");
      } else {
        interviewModeRef.current = "text";
        setMeetingStatus("waiting_user");
      }
    },
    [clearAnswerTimers, speakQuestion, speechRecognition, speechSynthesis],
  );

  const submitTextAnswer = async () => {
    const answer = textAnswer.trim();
    if (!answer) {
      setAnswerNotice("请输入回答内容。");
      return;
    }
    setTextAnswer("");
    await submitManualAnswer(answer);
  };

  const restartAnswer = () => {
    clearAnswerTimers();
    setCurrentUserTranscript("");
    setAnswerNotice("");
    speechRecognition.resetTranscript();
    if (interviewMode === "voice") {
      startListeningForAnswer();
    } else {
      setTextAnswer("");
      setMeetingStatus("waiting_user");
    }
  };

  const switchBackToVoiceMode = () => {
    setInterviewMode("voice");
    interviewModeRef.current = "voice";
    setAnswerNotice("");
    setTextAnswer("");
    if (meetingStatus === "ai_speaking" || meetingStatus === "ai_thinking") {
      return;
    }
    lastSpokenQuestionRef.current = "";
    setMeetingStatus("ai_speaking");
  };

  const skipQuestion = async () => {
    clearAnswerTimers();
    speechRecognition.stopListening();
    await submitManualAnswer("候选人选择跳过本题。");
  };

  const confirmEndMeeting = () => {
    clearAnswerTimers();
    speechRecognition.stopListening();
    speechSynthesis.cancel();
    setShowEndConfirm(true);
  };

  const exitWithoutReport = () => {
    clearAnswerTimers();
    speechRecognition.stopListening();
    speechSynthesis.cancel();
    setMeetingStatus("ended");
    setShowEndConfirm(false);
    router.push("/");
  };

  const statusText: Record<VoiceMeetingStatus, string> = {
    device_check: "设备检测",
    ai_speaking: "AI 正在提问",
    waiting_user: "等待候选人回答",
    user_speaking: "正在聆听你的回答",
    silence_detecting: "正在判断是否回答完毕",
    ai_thinking: "AI 正在分析",
    generating_report: "正在生成报告",
    ended: "面试结束",
  };

  const questionStateText: Record<VoiceMeetingStatus, string> = {
    device_check: "准备进入面试。",
    ai_speaking: "AI 面试官正在提问...",
    waiting_user: "请开始回答，系统会自动判断你是否说完。",
    user_speaking: "正在聆听你的回答...",
    silence_detecting: "检测到停顿，正在判断是否回答完毕...",
    ai_thinking: "AI 正在分析你的回答，并生成下一轮追问...",
    generating_report: "正在生成面试诊断报告...",
    ended: "面试结束。",
  };

  const modeText = interviewMode === "voice" ? "语音通话模式" : "文字面试模式";

  return (
    <main className="oc-meeting">
      <header className="oc-meeting-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span className="oc-logo" style={{ width: 30, height: 30, borderRadius: 8 }}>
            <MonitorUp size={17} />
          </span>
          <strong>AI 压力面试进行中</strong>
          <span className="oc-muted">· {modeText} · {formatClock(elapsedTime)}</span>
          <Wifi size={17} color="#10b981" />
          <ShieldCheck size={17} color="#2563eb" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="oc-tag" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
            {statusText[meetingStatus]}
          </span>
          <TopTool icon={<Grid2X2 size={16} />} label="布局" />
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
              <strong>当前 AI 面试官问题</strong>
              <span className="oc-tag">{currentType}</span>
            </div>
            <p style={{ margin: "12px 0 8px", color: "#111827", lineHeight: 1.8, fontWeight: 700 }}>
              {meetingStatus === "ai_thinking"
                ? "AI 正在分析你的回答"
                : meetingStatus === "generating_report"
                  ? questionStateText[meetingStatus]
                  : currentQuestion}
            </p>
            <p className="oc-muted" style={{ margin: 0 }}>
              {meetingStatus === "ai_thinking"
                ? THINKING_STEPS[thinkingStepIndex]
                : questionStateText[meetingStatus]}
            </p>
            {answerNotice && (
              <div className="oc-alert" style={{ marginTop: 12, padding: "8px 10px" }}>
                {answerNotice}
              </div>
            )}
          </div>

          <div className="oc-members">
            <MeetingMember
              active={meetingStatus === "ai_speaking" || meetingStatus === "ai_thinking"}
              icon={<Bot size={34} />}
              name="David"
              role="AI 面试官"
              status={
                meetingStatus === "ai_thinking"
                  ? "思考中"
                  : meetingStatus === "ai_speaking"
                    ? "正在提问"
                    : selectedCompany.meetingLabel
              }
              wave={meetingStatus === "ai_speaking" || meetingStatus === "ai_thinking"}
            />
            <MeetingMember
              active={meetingStatus === "user_speaking" || meetingStatus === "silence_detecting"}
              candidate
              icon={interviewMode === "text" ? <Keyboard size={32} /> : <Mic size={32} />}
              name="候选人"
              role={interviewMode === "text" ? "文字回答" : "语音回答"}
              status={
                meetingStatus === "user_speaking"
                  ? "正在回答"
                  : meetingStatus === "silence_detecting"
                    ? "停顿判断中"
                    : meetingStatus === "waiting_user"
                      ? "等待回答"
                      : "准备中"
              }
              wave={meetingStatus === "user_speaking" || meetingStatus === "silence_detecting"}
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
            {statusText[meetingStatus]} · 第 {Math.min(currentTurnIndex + 1, MAX_ROUNDS)}/{MAX_ROUNDS} 轮
          </div>
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
            <strong style={{ color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
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
            面试开始 {formatClock(elapsedTime)}
          </div>
          <div className="oc-record-list">
            {interviewRecords.map((record, index) => (
              <article className="oc-record" key={`${record.role}-${record.roundIndex}-${index}`}>
                <span className={`oc-record-dot ${record.role === "user" ? "is-user" : ""}`} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ color: record.role === "user" ? "#059669" : "#2563eb" }}>
                    {record.role === "user" ? "候选人" : "AI 面试官"}
                  </strong>
                  <span className="oc-tag">
                    {record.stage} · {record.type}
                  </span>
                </div>
                <p style={{ lineHeight: 1.8 }}>{record.content}</p>
              </article>
            ))}
            {currentUserTranscript && interviewMode === "voice" && (
              <article className="oc-record" style={{ opacity: 0.78 }}>
                <span className="oc-record-dot is-user" />
                <strong style={{ color: "#059669" }}>候选人正在回答</strong>
                <p style={{ lineHeight: 1.8 }}>{currentUserTranscript}</p>
              </article>
            )}
            {meetingStatus === "ai_thinking" && (
              <article className="oc-record" style={{ opacity: 0.82 }}>
                <span className="oc-record-dot" />
                <strong style={{ color: "#2563eb" }}>AI 面试官正在思考下一轮追问...</strong>
                <p style={{ lineHeight: 1.8 }}>{THINKING_STEPS[thinkingStepIndex]}</p>
              </article>
            )}
          </div>
          {interviewMode === "text" && meetingStatus !== "device_check" && (
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
                  value={textAnswer}
                  disabled={meetingStatus !== "waiting_user"}
                  placeholder="请输入你的回答，文字模式下点击发送进入下一轮。"
                  onChange={(event) => setTextAnswer(event.target.value)}
                  style={{
                    minHeight: 96,
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
                <button
                  className="oc-primary"
                  disabled={meetingStatus !== "waiting_user"}
                  onClick={submitTextAnswer}
                  style={{ minHeight: 38, padding: "0 12px" }}
                >
                  <Send size={16} />
                  发送回答
                </button>
              </div>
            </div>
          )}
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
            icon={<MonitorUp size={22} />}
            label={isVideoOn ? "关闭视频" : "开启视频"}
            onClick={() => setIsVideoOn((value) => !value)}
          />
          <ControlButton
            icon={<Volume2 size={22} />}
            label={speechSynthesis.isSpeaking ? "停止播报" : "播报问题"}
            onClick={() => {
              if (speechSynthesis.isSpeaking) {
                speechSynthesis.cancel();
                return;
              }
              speakQuestion(currentQuestionRef.current, true);
            }}
          />
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 48,
              border: "1px solid #dbe7f6",
              borderRadius: 12,
              background: "#fff",
              padding: "0 10px",
              color: "#374151",
              fontSize: 13,
            }}
          >
            AI 声音
            <select
              aria-label="AI 声音"
              value={selectedVoiceURI}
              onChange={(event) => {
                speechSynthesis.cancel();
                setSelectedVoiceURI(event.target.value);
              }}
              style={{
                maxWidth: 190,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                padding: "6px 8px",
              }}
            >
              <option value="">系统默认中文</option>
              {speechSynthesis.voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} · {voice.lang}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {interviewMode === "voice" ? (
            <>
              <button className="oc-secondary" onClick={restartAnswer}>
                <RotateCcw size={16} />
                重新回答
              </button>
              <button className="oc-secondary" onClick={skipQuestion}>
                <SkipForward size={16} />
                跳过本题
              </button>
              <button className="oc-secondary" onClick={() => switchToTextMode("已切换到文字面试模式。")}>
                <Keyboard size={16} />
                切换文字模式
              </button>
            </>
          ) : (
            <>
              <span className="oc-muted">文字模式已开启，请在右侧面板输入回答。</span>
              <button className="oc-secondary" onClick={switchBackToVoiceMode}>
                <Mic size={16} />
                切回语音模式
              </button>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="oc-control oc-end" onClick={confirmEndMeeting}>
            <PhoneOff size={22} />
            <span>结束面试</span>
          </button>
        </div>
      </footer>

      {meetingStatus === "device_check" && (
        <DeviceModal
          candidateReady={Boolean(candidateProfile)}
          companyStyle={companyStyle}
          onStartText={() => initializeInterview("text")}
          onStartVoice={() => initializeInterview("voice")}
        />
      )}

      {showEndConfirm && (
        <ConfirmModal
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={() => generateReport(interviewRecordsRef.current)}
          onExit={exitWithoutReport}
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
  active,
  candidate,
  icon,
  name,
  role,
  status,
  wave,
}: {
  active: boolean;
  candidate?: boolean;
  icon: ReactNode;
  name: string;
  role: string;
  status: string;
  wave?: boolean;
}) {
  return (
    <div className="oc-member">
      <div className={`oc-avatar ${active ? "is-active" : ""} ${candidate ? "oc-avatar-candidate" : ""}`}>
        {wave && (
          <span
            style={{
              position: "absolute",
              inset: -8,
              border: "2px solid #60a5fa",
              borderRadius: 999,
              opacity: 0.38,
              animation: "oc-pulse 1.4s ease-out infinite",
            }}
          />
        )}
        {icon}
      </div>
      <strong style={{ display: "block", marginTop: 12, color: "#111827" }}>{name}</strong>
      <p className="oc-muted" style={{ margin: "4px 0" }}>{role}</p>
      <span className="oc-tag">{status}</span>
      <style jsx>{`
        @keyframes oc-pulse {
          from {
            transform: scale(0.9);
            opacity: 0.45;
          }
          to {
            transform: scale(1.35);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function ControlButton({
  danger,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button className={`oc-control ${danger ? "oc-end" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DeviceModal({
  candidateReady,
  companyStyle,
  onStartText,
  onStartVoice,
}: {
  candidateReady: boolean;
  companyStyle: CompanyStyle;
  onStartText: () => void;
  onStartVoice: () => void;
}) {
  const [micStatus, setMicStatus] = useState<DeviceCheckStatus>("checking");
  const [ttsStatus, setTtsStatus] = useState<DeviceCheckStatus>("checking");

  useEffect(() => {
    let disposed = false;
    let recognition: DeviceCheckSpeechRecognition | null = null;
    let micTimer: number | null = null;
    let ttsTimer: number | null = null;

    const finishMicCheck = (status: DeviceCheckStatus) => {
      if (disposed) return;
      setMicStatus(status);
      if (micTimer !== null) {
        window.clearTimeout(micTimer);
        micTimer = null;
      }
      if (recognition) {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        try {
          recognition.abort();
        } catch {
          // Ignore browser cleanup noise.
        }
      }
    };

    const finishTtsCheck = (status: DeviceCheckStatus) => {
      if (disposed) return;
      setTtsStatus(status);
      if (ttsTimer !== null) {
        window.clearTimeout(ttsTimer);
        ttsTimer = null;
      }
    };

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      finishTtsCheck("unsupported");
    } else {
      finishTtsCheck("available");
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      finishMicCheck("unsupported");
    } else {
      try {
        recognition = new Recognition() as DeviceCheckSpeechRecognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "zh-CN";
        recognition.onresult = () => finishMicCheck("available");
        recognition.onend = () => {
          if (micStatus === "checking") finishMicCheck("available");
        };
        recognition.onerror = (event) => {
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            finishMicCheck("unauthorized");
            return;
          }
          if (event.error === "aborted") {
            return;
          }
          finishMicCheck("unsupported");
        };
        micTimer = window.setTimeout(() => finishMicCheck("available"), 1800);
        recognition.start();
      } catch {
        finishMicCheck("unsupported");
      }
    }

    return () => {
      disposed = true;
      if (micTimer !== null) window.clearTimeout(micTimer);
      if (ttsTimer !== null) window.clearTimeout(ttsTimer);
      if (recognition) {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        try {
          recognition.abort();
        } catch {
          // Ignore browser cleanup noise.
        }
      }
    };
  }, []);

  return (
    <div className="oc-modal-backdrop">
      <section className="oc-card oc-modal">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="oc-logo">
            <Bot size={20} />
          </span>
          <div>
            <h2 style={{ margin: 0 }}>准备进入 AI 语音压力面试</h2>
            <p className="oc-muted" style={{ margin: "6px 0 0", lineHeight: 1.7 }}>
              系统将使用浏览器语音识别和 AI 语音播报模拟实时语音面试。AI
              面试官会主动提问，你可以直接说话回答，系统会自动判断你是否说完。
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
          <CheckItem
            label="麦克风识别"
            value={getDeviceStatusText(micStatus)}
            ok={isDeviceStatusOk(micStatus)}
          />
          <CheckItem
            label="AI 语音播报"
            value={getDeviceStatusText(ttsStatus)}
            ok={isDeviceStatusOk(ttsStatus)}
          />
          <CheckItem label="简历档案" value={candidateReady ? "已读取" : "使用示例档案"} ok />
          <CheckItem
            label="面试官风格"
            value={companyStyle === "bytedance" ? "字节风格" : "腾讯风格"}
            ok
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="oc-secondary" onClick={onStartText}>
            <Keyboard size={16} />
            使用文字模式
          </button>
          <button className="oc-primary" onClick={onStartVoice}>
            <Mic size={16} />
            开始语音面试
          </button>
        </div>
      </section>
    </div>
  );
}

function CheckItem({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  const checking = value === "检测中";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <span style={{ color: "#374151" }}>{label}</span>
      <strong style={{ display: "inline-flex", alignItems: "center", gap: 6, color: checking ? "#2563eb" : ok ? "#059669" : "#b45309" }}>
        {ok ? <Check size={16} /> : <MoreHorizontal className={checking ? "spin" : ""} size={16} />}
        {value}
      </strong>
    </div>
  );
}

function ConfirmModal({
  onCancel,
  onConfirm,
  onExit,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  onExit: () => void;
}) {
  return (
    <div className="oc-modal-backdrop">
      <section className="oc-card oc-modal">
        <h2 style={{ marginTop: 0 }}>确定结束本轮面试并生成诊断报告吗？</h2>
        <p className="oc-muted" style={{ lineHeight: 1.8 }}>
          系统会基于当前已经记录的面试内容生成报告。语音识别和播报会立即停止。
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button className="oc-secondary" onClick={onExit}>
            不生成报告并退出
          </button>
          <button className="oc-secondary" onClick={onCancel}>继续面试</button>
          <button className="oc-primary" onClick={onConfirm}>生成报告</button>
        </div>
      </section>
    </div>
  );
}
