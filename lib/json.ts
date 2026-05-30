export function safeParseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue with recovery strategies below.
  }

  const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/i);

  if (jsonBlock?.[1]) {
    try {
      return JSON.parse(jsonBlock[1].trim()) as T;
    } catch {
      // Continue with object extraction below.
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      // Fall through to fallback.
    }
  }

  return fallback;
}
