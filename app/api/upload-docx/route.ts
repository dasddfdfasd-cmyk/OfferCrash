import { NextResponse } from "next/server";

import { parseDocxToText } from "@/lib/docx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "没有上传文件" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { success: false, error: "文件不是 .docx" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "文件超过 5MB" },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawText = await parseDocxToText(Buffer.from(arrayBuffer));

    return NextResponse.json({
      success: true,
      rawText,
      fileName: file.name,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "解析文本为空"
        ? error.message
        : "DOCX 解析失败";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
