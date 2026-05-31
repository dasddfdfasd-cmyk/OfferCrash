import { NextResponse } from "next/server";

import { parseDocxToText } from "@/lib/docx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { success: false, error: "请求格式错误，请使用 multipart/form-data 上传文件" },
        { status: 400 },
      );
    }

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
    const reason = error instanceof Error && error.message ? error.message : "未知错误";

    return NextResponse.json(
      { success: false, error: `DOCX 解析失败：${reason}` },
      { status: 500 },
    );
  }
}
