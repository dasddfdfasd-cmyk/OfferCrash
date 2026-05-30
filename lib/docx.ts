import mammoth from "mammoth";

export async function parseDocxToText(fileBuffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  const rawText = result.value.trim();

  if (!rawText) {
    throw new Error("解析文本为空");
  }

  return rawText;
}
