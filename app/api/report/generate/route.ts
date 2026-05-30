import { NextResponse } from "next/server";

import { callTextModel } from "@/lib/llm";
import { mockReport } from "@/lib/mockData";
import { buildReportGenerationPrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/json";
import type {
  CandidateProfile,
  CompanyStyle,
  InterviewRecord,
  InterviewReport,
} from "@/types/interview";

export const runtime = "nodejs";

interface GenerateReportRequest {
  candidateProfile?: CandidateProfile;
  companyStyle?: CompanyStyle;
  interviewRecords?: InterviewRecord[];
  duration?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateReportRequest;

    if (!body.candidateProfile) {
      return NextResponse.json(
        { success: false, error: "候选人档案不能为空" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.interviewRecords)) {
      return NextResponse.json(
        { success: false, error: "面试记录不能为空" },
        { status: 400 },
      );
    }

    const companyStyle = body.companyStyle ?? "bytedance";

    try {
      const prompt = buildReportGenerationPrompt({
        candidateProfile: body.candidateProfile,
        companyStyle,
        interviewRecords: body.interviewRecords,
        duration: body.duration,
      });
      const modelText = await callTextModel(prompt);
      const report = safeParseJson<InterviewReport>(modelText, mockReport);
      const fallback = report === mockReport;

      return NextResponse.json({
        success: true,
        report,
        fallback,
      });
    } catch {
      return NextResponse.json({
        success: true,
        report: mockReport,
        fallback: true,
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体格式错误" },
      { status: 400 },
    );
  }
}
