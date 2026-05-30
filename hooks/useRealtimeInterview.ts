"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  RealtimeInterviewClient,
  type RealtimeClientEvent,
  type RealtimeStartPayload,
} from "@/lib/realtimeClient";

type UseRealtimeInterviewParams = {
  onAssistantText: (payload: {
    content: string;
    stage?: string;
    followUpType?: string;
  }) => void;
  onUserTranscript: (payload: { content: string; isFinal: boolean }) => void;
  onFallback: (message: string) => void;
};

export function useRealtimeInterview({
  onAssistantText,
  onUserTranscript,
  onFallback,
}: UseRealtimeInterviewParams) {
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("文字面试模式");
  const clientRef = useRef<RealtimeInterviewClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    clientRef.current?.stopAudio();
    setIsRecording(false);
  }, []);

  const fallbackToTextMode = useCallback(
    (message = "实时语音连接异常，已切换到文字面试模式。") => {
      stopRecording();
      clientRef.current?.close();
      clientRef.current = null;
      setIsRealtimeMode(false);
      setIsConnecting(false);
      setStatusText("文字面试模式");
      onFallback(message);
    },
    [onFallback, stopRecording],
  );

  const playAssistantAudio = useCallback((audio: string, format: string) => {
    if (!audio) return;

    try {
      const mimeType = format.includes("/") ? format : `audio/${format}`;
      const source = `data:${mimeType};base64,${audio}`;
      const player = new Audio(source);
      audioQueueRef.current.push(player);
      player.onended = () => {
        audioQueueRef.current = audioQueueRef.current.filter((item) => item !== player);
      };
      void player.play().catch(() => {
        audioQueueRef.current = audioQueueRef.current.filter((item) => item !== player);
      });
    } catch {
      fallbackToTextMode("音频格式不兼容，已切换到文字面试模式。");
    }
  }, [fallbackToTextMode]);

  const handleGatewayEvent = useCallback(
    (event: RealtimeClientEvent) => {
      if (event.type === "session_started") {
        setIsConnecting(false);
        setStatusText("实时语音模式已连接");
        return;
      }

      if (event.type === "assistant_text") {
        onAssistantText({
          content: event.content,
          stage: event.stage,
          followUpType: event.followUpType,
        });
        return;
      }

      if (event.type === "user_transcript") {
        onUserTranscript({ content: event.content, isFinal: event.isFinal });
        return;
      }

      if (event.type === "assistant_audio") {
        playAssistantAudio(event.audio, event.format);
        return;
      }

      if (event.type === "error") {
        fallbackToTextMode(event.message);
        return;
      }

      if (event.type === "session_ended") {
        stopRecording();
        setIsRealtimeMode(false);
        setStatusText("文字面试模式");
      }
    },
    [fallbackToTextMode, onAssistantText, onUserTranscript, playAssistantAudio, stopRecording],
  );

  const startRealtime = useCallback(
    async (payload: RealtimeStartPayload) => {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_REALTIME_GATEWAY_URL || "ws://localhost:8787/ws/interview";

      try {
        setIsConnecting(true);
        setStatusText("正在连接实时语音模式");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const client = new RealtimeInterviewClient(gatewayUrl, {
          onEvent: handleGatewayEvent,
          onError: fallbackToTextMode,
          onClose: () => {
            if (isRealtimeMode) {
              fallbackToTextMode("实时语音连接已断开，已切换到文字面试模式。");
            }
          },
        });
        clientRef.current = client;
        client.connect(payload);

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = async (event) => {
          if (event.data.size === 0) return;
          const audio = await blobToBase64(event.data);
          client.sendAudioChunk(audio, mimeType, 48000);
        };
        recorder.onerror = () => {
          fallbackToTextMode("麦克风采集异常，已切换到文字面试模式。");
        };
        recorder.start(250);

        setIsRealtimeMode(true);
        setIsRecording(true);
      } catch {
        fallbackToTextMode("实时语音连接异常，已切换到文字面试模式。");
      }
    },
    [fallbackToTextMode, handleGatewayEvent, isRealtimeMode],
  );

  const stopRealtime = useCallback(() => {
    stopRecording();
    clientRef.current?.end();
    clientRef.current = null;
    setIsRealtimeMode(false);
    setIsConnecting(false);
    setStatusText("文字面试模式");
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
      clientRef.current?.close();
      audioQueueRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioQueueRef.current = [];
    };
  }, [stopRecording]);

  return {
    isRealtimeMode,
    isConnecting,
    isRecording,
    statusText,
    startRealtime,
    stopRealtime,
    fallbackToTextMode,
  };
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}
