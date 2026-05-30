"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const keepAliveRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakRunRef = useRef(0);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);

    return () => {
      speakRunRef.current += 1;
      utteranceRef.current = null;
      clearKeepAlive();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearKeepAlive]);

  const splitText = useCallback((text: string) => {
    return text
      .replace(/\s+/g, " ")
      .split(/(?<=[。！？?])/)
      .flatMap((sentence) => {
        const clean = sentence.trim();
        if (clean.length <= 70) return clean ? [clean] : [];

        const chunks: string[] = [];
        for (let index = 0; index < clean.length; index += 70) {
          chunks.push(clean.slice(index, index + 70));
        }
        return chunks;
      });
  }, []);

  const getChineseVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ??
      null
    );
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      return;
    }

    const chunks = splitText(text);
    if (chunks.length === 0) return;

    const runId = speakRunRef.current + 1;
    speakRunRef.current = runId;
    utteranceRef.current = null;
    clearKeepAlive();
    window.speechSynthesis.cancel();

    keepAliveRef.current = window.setInterval(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 750);

    const speakChunk = (index: number) => {
      if (speakRunRef.current !== runId) return;
      if (index >= chunks.length) {
        utteranceRef.current = null;
        clearKeepAlive();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = "zh-CN";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.voice = getChineseVoice();
      utteranceRef.current = utterance;
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => {
        utteranceRef.current = null;
        clearKeepAlive();
      };

      window.speechSynthesis.speak(utterance);
    };

    window.setTimeout(() => speakChunk(0), 80);
  }, [clearKeepAlive, getChineseVoice, splitText]);

  const stop = useCallback(() => {
    speakRunRef.current += 1;
    utteranceRef.current = null;
    clearKeepAlive();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [clearKeepAlive]);

  return useMemo(() => ({
    isSupported,
    speak,
    stop,
  }), [isSupported, speak, stop]);
}
