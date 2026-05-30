export function sanitizeTextForTTS(text: string): string {
  return text
    .replace(/[#*`>]/g, "")
    .replace(/(^|\s)-\s+/g, "$1")
    .replace(/[“”‘’《》]/g, "")
    .replace(/[（）()]/g, " ")
    .replace(/——/g, "，")
    .replace(/\.{3,}/g, "。")
    .replace(/…+/g, "。")
    .replace(/[：:；;]/g, "。")
    .replace(/、/g, "，")
    .replace(/？{2,}/g, "？")
    .replace(/！{2,}/g, "！")
    .replace(/。{2,}/g, "。")
    .replace(/[^\p{Script=Han}\p{Script=Latin}\p{Number}\s，。？！,.?!]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongSentence(sentence: string) {
  if (sentence.length <= 70) return [sentence];

  const commaParts = sentence.split(/(?<=[，,])/);
  const chunks: string[] = [];
  let current = "";

  for (const part of commaParts) {
    const next = `${current}${part}`.trim();
    if (next.length <= 70) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);
    if (part.length <= 70) {
      current = part.trim();
      continue;
    }

    for (let index = 0; index < part.length; index += 70) {
      chunks.push(part.slice(index, index + 70).trim());
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

export function splitTextForTTS(text: string): string[] {
  const sanitizedText = sanitizeTextForTTS(text);
  if (!sanitizedText) return [];

  return sanitizedText
    .split(/(?<=[。？！])/)
    .flatMap((sentence) => splitLongSentence(sentence.trim()))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
