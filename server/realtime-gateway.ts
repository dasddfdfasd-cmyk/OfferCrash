import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import WebSocket, { WebSocketServer } from "ws";

import {
  closeSession,
  connectDoubaoRealtime,
  normalizeDoubaoEvent,
  sendAudioChunk,
  sendSessionStart,
  sendStopAudio,
} from "./doubaoRealtimeClient.ts";

loadLocalEnv();

type ClientMessage =
  | {
      type: "start";
      sessionId: string;
      companyStyle: string;
      candidateProfile: unknown;
      interviewRecords: unknown[];
    }
  | {
      type: "audio_chunk";
      audio: string;
      format: string;
      sampleRate?: number;
    }
  | { type: "stop_audio" }
  | { type: "end" };

const PORT = Number(process.env.REALTIME_GATEWAY_PORT ?? 8787);
const PATH = "/ws/interview";

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  if (request.url !== PATH) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (client) => {
    wss.emit("connection", client, request);
  });
});

wss.on("connection", (client) => {
  let doubaoSocket: WebSocket | null = null;

  const sendClient = (payload: Record<string, unknown>) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  };

  const fallbackToTextMode = (message: string) => {
    sendClient({
      type: "error",
      message: message || "实时语音连接异常，已切换到文字面试模式。",
    });
  };

  client.on("message", async (raw) => {
    const message = parseClientMessage(raw.toString());
    if (!message) {
      fallbackToTextMode("实时语音消息格式异常，已切换到文字面试模式。");
      return;
    }

    try {
      if (message.type === "start") {
        doubaoSocket = await connectDoubaoRealtime();
        doubaoSocket.on("message", (eventRaw) => {
          const normalized = normalizeDoubaoEvent(eventRaw.toString());
          if (normalized) {
            sendClient(normalized);
          }
        });
        doubaoSocket.on("error", (error) => fallbackToTextMode(error.message));
        doubaoSocket.on("close", () => sendClient({ type: "session_ended" }));

        sendSessionStart(doubaoSocket, {
          sessionId: message.sessionId,
          prompt: buildRealtimeInterviewPrompt({
            companyStyle: message.companyStyle,
            candidateProfile: message.candidateProfile,
          }),
        });
        sendClient({ type: "session_started" });
        return;
      }

      if (!doubaoSocket || doubaoSocket.readyState !== WebSocket.OPEN) {
        fallbackToTextMode("豆包实时语音未连接，已切换到文字面试模式。");
        return;
      }

      if (message.type === "audio_chunk") {
        sendAudioChunk(doubaoSocket, message);
      } else if (message.type === "stop_audio") {
        sendStopAudio(doubaoSocket);
      } else if (message.type === "end") {
        closeSession(doubaoSocket);
        sendClient({ type: "session_ended" });
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "实时语音连接异常";
      fallbackToTextMode(`${messageText}，已切换到文字面试模式。`);
    }
  });

  client.on("close", () => {
    if (doubaoSocket) {
      closeSession(doubaoSocket);
    }
  });
});

server.listen(PORT, () => {
  console.log(`OfferCrash realtime gateway listening on port ${PORT}${PATH}`);
});

function parseClientMessage(text: string): ClientMessage | null {
  try {
    const message = JSON.parse(text) as ClientMessage;
    return typeof message?.type === "string" ? message : null;
  } catch {
    return null;
  }
}

function buildRealtimeInterviewPrompt(params: {
  companyStyle: string;
  candidateProfile: unknown;
}) {
  return `你不是聊天助手，而是一名产品经理校招压力面试官。
你必须主动主持面试。
用户只负责回答问题，你负责主动开场、主动提问、主动追问、主动质疑和推进流程。
每次只问一个问题。
不要等待用户提问。
不要问“你想让我问什么”。
不要提前给建议。
不要安慰用户。
用户说“提升、优化、改善”时，必须追问具体指标。
用户频繁说“我们”时，必须追问个人贡献。
用户提到用户需求但没有调研依据时，必须追问用户样本和需求真实性。
高压追问可以直接，但不能羞辱或人格攻击。
岗位：产品经理校招 / 实习。
面试官风格：${params.companyStyle}
候选人档案：${JSON.stringify(params.candidateProfile)}`;
}

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

      const [key, ...valueParts] = trimmed.split("=");
      if (!key || process.env[key] !== undefined) continue;
      process.env[key] = valueParts.join("=");
    }
  }
}
