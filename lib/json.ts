export function safeParseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/i);

    if (jsonBlock?.[1]) {
      try {
        return JSON.parse(jsonBlock[1]) as T;
      } catch {
        return fallback;
      }
    }

    return fallback;
  }
}
