import { NextResponse } from "next/server";

import { callTextModel } from "@/lib/llm";
import { mockCandidateProfile } from "@/lib/mockData";
import { buildProfileExtractionPrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/json";
import type { CandidateProfile } from "@/types/interview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawText?: unknown };
    const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "简历文本不能为空" },
        { status: 400 },
      );
    }

    try {
      const prompt = buildProfileExtractionPrompt(rawText);
      const modelText = await callTextModel(prompt);
      const candidateProfile = safeParseJson<CandidateProfile>(
        modelText,
        mockCandidateProfile,
      );
      const fallback = candidateProfile === mockCandidateProfile;

      return NextResponse.json({
        success: true,
        candidateProfile,
        fallback,
      });
    } catch {
      return NextResponse.json({
        success: true,
        candidateProfile: mockCandidateProfile,
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
