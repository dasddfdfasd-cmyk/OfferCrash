import WebSocket from "ws";

export type DoubaoRealtimeConfig = {
  apiKey: string;
  appId?: string;
  endpoint: string;
  resourceId?: string;
  model: string;
};

export type NormalizedDoubaoEvent =
  | { type: "assistant_text"; content: string; stage?: string; followUpType?: string }
  | { type: "user_transcript"; content: string; isFinal: boolean }
  | { type: "assistant_audio"; audio: string; format: string; sampleRate: number }
  | { type: "session_ended" }
  | { type: "error"; message: string };

export function getDoubaoRealtimeConfig(): DoubaoRealtimeConfig {
  const apiKey = process.env.DOUBAO_REALTIME_API_KEY;
  const appId = process.env.DOUBAO_REALTIME_APP_ID;
  const endpoint =
    process.env.DOUBAO_REALTIME_ENDPOINT || "wss://ai-gateway.vei.volces.com/v1/realtime";
  const resourceId = process.env.DOUBAO_REALTIME_RESOURCE_ID;
  const model = process.env.DOUBAO_REALTIME_MODEL || "AG-voice-chat-agent";

  const missing = [
    ["DOUBAO_REALTIME_API_KEY", apiKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Doubao realtime env: ${missing.join(", ")}`);
  }

  return {
    apiKey: apiKey!,
    appId,
    endpoint,
    resourceId,
    model,
  };
}

export function connectDoubaoRealtime(config = getDoubaoRealtimeConfig()): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    // TODO: 按豆包官方 RealtimeAPI 文档确认是否还需要 App ID / Resource ID 等扩展请求头。
    const endpoint = new URL(config.endpoint);
    if (!endpoint.searchParams.has("model")) {
      endpoint.searchParams.set("model", config.model);
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
    };
    if (config.appId) headers["X-Api-App-Id"] = config.appId;
    if (config.resourceId) headers["X-Api-Resource-Id"] = config.resourceId;

    const socket = new WebSocket(endpoint, { headers });

    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

export function sendSessionStart(
  socket: WebSocket,
  params: {
    sessionId: string;
    prompt: string;
    model?: string;
  },
) {
  const config = getDoubaoRealtimeConfig();
  // TODO: 按豆包官方 RealtimeAPI 文档确认 session.start 事件名和 payload 结构。
  socket.send(
    JSON.stringify({
      type: "session.start",
      session_id: params.sessionId,
      model: params.model ?? config.model,
      instructions: params.prompt,
      modalities: ["text", "audio"],
      audio: {
        input_format: "webm",
        output_format: "mp3",
      },
    }),
  );
}

export function sendAudioChunk(
  socket: WebSocket,
  params: {
    audio: string;
    format: string;
    sampleRate?: number;
  },
) {
  // TODO: 按豆包官方 RealtimeAPI 文档确认 audio append 事件名、编码和采样率字段。
  socket.send(
    JSON.stringify({
      type: "input_audio_buffer.append",
      audio: params.audio,
      format: params.format,
      sample_rate: params.sampleRate,
    }),
  );
}

export function sendStopAudio(socket: WebSocket) {
  // TODO: 按豆包官方 RealtimeAPI 文档确认音频提交/停止事件名。
  socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
}

export function closeSession(socket: WebSocket) {
  if (socket.readyState === WebSocket.OPEN) {
    // TODO: 按豆包官方 RealtimeAPI 文档确认 session.close 事件名。
    socket.send(JSON.stringify({ type: "session.close" }));
  }
  socket.close();
}

export function normalizeDoubaoEvent(raw: unknown): NormalizedDoubaoEvent | null {
  const event = typeof raw === "string" ? safeJson(raw) : raw;
  if (!event || typeof event !== "object") return null;

  const payload = event as Record<string, unknown>;
  const type = String(payload.type ?? payload.event ?? "");

  // TODO: 按豆包官方 RealtimeAPI 文档确认实际事件字段。
  if (type.includes("transcript") || type.includes("user_text")) {
    return {
      type: "user_transcript",
      content: String(payload.text ?? payload.content ?? payload.transcript ?? ""),
      isFinal: Boolean(payload.is_final ?? payload.final ?? type.includes("completed")),
    };
  }

  if (type.includes("assistant") && (type.includes("text") || type.includes("delta"))) {
    return {
      type: "assistant_text",
      content: String(payload.text ?? payload.content ?? payload.delta ?? ""),
      stage: typeof payload.stage === "string" ? payload.stage : undefined,
      followUpType: typeof payload.followUpType === "string" ? payload.followUpType : undefined,
    };
  }

  if (type.includes("audio")) {
    return {
      type: "assistant_audio",
      audio: String(payload.audio ?? payload.data ?? ""),
      format: String(payload.format ?? "mp3"),
      sampleRate: Number(payload.sample_rate ?? payload.sampleRate ?? 24000),
    };
  }

  if (type.includes("error")) {
    return {
      type: "error",
      message: String(payload.message ?? payload.error ?? "Doubao realtime error"),
    };
  }

  if (type.includes("ended") || type.includes("closed")) {
    return { type: "session_ended" };
  }

  return null;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
