import { NextResponse } from "next/server";

import { safeParseJson } from "@/lib/json";
import { callTextModel } from "@/lib/llm";
import { mockInterviewTurns } from "@/lib/mockData";
import { buildNextQuestionPrompt } from "@/lib/prompts";
import type {
  NextQuestionRequest,
  NextQuestionResponse,
} from "@/types/interview";

export const runtime = "nodejs";

const CLOSING_RESPONSE: Omit<NextQuestionResponse, "success"> = {
  nextQuestion:
    "好，本轮面试先到这里。我已经记录了你的表现，接下来系统会生成面试诊断报告。",
  stage: "收尾",
  type: "收尾",
  reason: "达到最大追问轮数",
  shouldEnd: true,
  fallback: false,
};

function getFallbackQuestion(roundIndex: number, error?: string): NextQuestionResponse {
  const nextTurn = mockInterviewTurns[roundIndex + 1];

  if (!nextTurn) {
    return {
      success: true,
      ...CLOSING_RESPONSE,
      fallback: true,
      error,
    };
  }

  return {
    success: true,
    nextQuestion: nextTurn.ai,
    stage: nextTurn.stage,
    type: nextTurn.type,
    reason: "模型生成失败，使用固定 Mock 追问兜底",
    shouldEnd: nextTurn.type === "closing",
    fallback: true,
    error,
  };
}

function getOpeningQuestion(): NextQuestionResponse {
  const openingTurn = mockInterviewTurns[0];

  return {
    success: true,
    nextQuestion: openingTurn.ai,
    stage: openingTurn.stage,
    type: openingTurn.type,
    reason: "面试记录为空，返回开场问题",
    shouldEnd: false,
    fallback: false,
  };
}

function isValidNextQuestionResponse(
  value: NextQuestionResponse,
): value is NextQuestionResponse {
  return (
    typeof value.nextQuestion === "string" &&
    value.nextQuestion.trim().length > 0 &&
    typeof value.stage === "string" &&
    value.stage.trim().length > 0 &&
    typeof value.type === "string" &&
    value.type.trim().length > 0 &&
    typeof value.reason === "string" &&
    typeof value.shouldEnd === "boolean"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NextQuestionRequest;
    const roundIndex = Number.isFinite(body.roundIndex) ? body.roundIndex : 0;

    if (roundIndex >= 7) {
      return NextResponse.json({
        success: true,
        ...CLOSING_RESPONSE,
      });
    }

    if (!Array.isArray(body.interviewRecords) || body.interviewRecords.length === 0) {
      return NextResponse.json(getOpeningQuestion());
    }

    try {
      const prompt = buildNextQuestionPrompt({
        candidateProfile: body.candidateProfile,
        companyStyle: body.companyStyle,
        interviewRecords: body.interviewRecords,
        currentStage: body.currentStage,
        roundIndex,
      });
      const modelText = await callTextModel(prompt);
      const parsed = safeParseJson<NextQuestionResponse>(
        modelText,
        getFallbackQuestion(roundIndex, "模型返回内容不是可解析的 NextQuestionResponse JSON"),
      );

      if (!isValidNextQuestionResponse(parsed) || parsed.fallback) {
        return NextResponse.json(getFallbackQuestion(roundIndex, parsed.error));
      }

      return NextResponse.json({
        success: true,
        nextQuestion: parsed.nextQuestion,
        stage: parsed.stage,
        type: parsed.type,
        reason: parsed.reason,
        shouldEnd: parsed.shouldEnd,
        fallback: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "动态追问生成失败";
      return NextResponse.json(getFallbackQuestion(roundIndex, message));
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        nextQuestion: "",
        stage: "",
        type: "",
        reason: "请求体格式错误",
        shouldEnd: false,
        fallback: true,
        error: "请求体格式错误",
      },
      { status: 400 },
    );
  }
}
