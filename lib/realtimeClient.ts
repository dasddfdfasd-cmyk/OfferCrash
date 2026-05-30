import type {
  CandidateProfile,
  CompanyStyle,
  InterviewRecord,
} from "@/types/interview";

export type RealtimeMode = "text" | "realtime";

export type RealtimeClientEvent =
  | { type: "session_started" }
  | { type: "assistant_text"; content: string; stage?: string; followUpType?: string }
  | { type: "user_transcript"; content: string; isFinal: boolean }
  | { type: "assistant_audio"; audio: string; format: string; sampleRate: number }
  | { type: "error"; message: string }
  | { type: "session_ended" };

export type RealtimeStartPayload = {
  sessionId: string;
  companyStyle: CompanyStyle;
  candidateProfile: CandidateProfile;
  interviewRecords: InterviewRecord[];
};

export type RealtimeClientHandlers = {
  onEvent: (event: RealtimeClientEvent) => void;
  onError: (message: string) => void;
  onClose: () => void;
};

export class RealtimeInterviewClient {
  private socket: WebSocket | null = null;

  constructor(
    private readonly url: string,
    private readonly handlers: RealtimeClientHandlers,
  ) {}

  connect(payload: RealtimeStartPayload) {
    this.close();

    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.send({
        type: "start",
        ...payload,
      });
    };
    this.socket.onmessage = (message) => {
      const event = parseRealtimeEvent(message.data);
      if (!event) return;

      if (event.type === "error") {
        this.handlers.onError(event.message);
      }
      this.handlers.onEvent(event);
    };
    this.socket.onerror = () => {
      this.handlers.onError("实时语音连接异常，已切换到文字面试模式。");
    };
    this.socket.onclose = () => {
      this.handlers.onClose();
    };
  }

  sendAudioChunk(audio: string, format: string, sampleRate?: number) {
    this.send({
      type: "audio_chunk",
      audio,
      format,
      sampleRate,
    });
  }

  stopAudio() {
    this.send({ type: "stop_audio" });
  }

  end() {
    this.send({ type: "end" });
    this.close();
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}

function parseRealtimeEvent(data: unknown): RealtimeClientEvent | null {
  if (typeof data !== "string") return null;

  try {
    const event = JSON.parse(data) as RealtimeClientEvent;
    return typeof event?.type === "string" ? event : null;
  } catch {
    return null;
  }
}
