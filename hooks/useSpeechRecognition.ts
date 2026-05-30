"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const [error, setError] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const detachAndAbort = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.onend = null;
    recognitionRef.current.onerror = null;
    recognitionRef.current.onresult = null;
    recognitionRef.current.abort();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    setIsSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return detachAndAbort;
  }, [detachAndAbort]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setError("当前浏览器不支持语音识别，请使用文字输入回答。");
      setIsListening(false);
      return false;
    }

    detachAndAbort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";
    recognition.onresult = (event) => {
      let interim = "";
      let finalDelta = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalDelta += text;
        } else {
          interim += text;
        }
      }

      if (finalDelta) {
        finalTranscriptRef.current = `${finalTranscriptRef.current}${finalDelta}`;
        setFinalTranscript(finalTranscriptRef.current.trim());
      }
      setInterimTranscript(interim.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        setIsListening(false);
        return;
      }

      const message =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "麦克风权限未授权，请使用文字输入回答。"
          : `语音识别异常：${event.error || "unknown"}`;
      setError(message);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setError("");
    setIsListening(true);

    try {
      recognition.start();
      return true;
    } catch {
      setError("语音识别启动失败，请使用文字输入回答。");
      setIsListening(false);
      return false;
    }
  }, [detachAndAbort]);

  const transcript = `${finalTranscript} ${interimTranscript}`.trim();

  return useMemo(
    () => ({
      error,
      finalTranscript,
      interimTranscript,
      isListening,
      isSupported,
      resetTranscript,
      startListening,
      stopListening,
      transcript,
    }),
    [
      error,
      finalTranscript,
      interimTranscript,
      isListening,
      isSupported,
      resetTranscript,
      startListening,
      stopListening,
      transcript,
    ],
  );
}
