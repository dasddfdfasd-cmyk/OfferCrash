"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { splitTextForTTS } from "@/lib/tts";

type SpeakOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
};

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const keepAliveRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakRunRef = useRef(0);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const availableVoices = window.speechSynthesis.getVoices();
    const chineseVoices = availableVoices.filter((voice) =>
      voice.lang.toLowerCase().startsWith("zh"),
    );
    setVoices(chineseVoices.length > 0 ? chineseVoices : availableVoices);
  }, []);

  useEffect(() => {
    const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setIsSupported(supported);
    if (supported) {
      refreshVoices();
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    }

    return () => {
      speakRunRef.current += 1;
      utteranceRef.current = null;
      clearKeepAlive();
      setIsSpeaking(false);
      if (supported) {
        window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearKeepAlive, refreshVoices]);

  const getPreferredVoice = useCallback((voiceURI?: string) => {
    const availableVoices = window.speechSynthesis.getVoices();
    if (voiceURI) {
      const selectedVoice = availableVoices.find((voice) => voice.voiceURI === voiceURI);
      if (selectedVoice) return selectedVoice;
    }

    return (
      availableVoices.find(
        (voice) =>
          voice.lang.toLowerCase() === "zh-cn" &&
          voice.name.toLowerCase().includes("microsoft yunjian online"),
      ) ??
      availableVoices.find(
        (voice) =>
          voice.lang.toLowerCase() === "zh-cn" &&
          voice.name.toLowerCase().includes("yunjian"),
      ) ??
      availableVoices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ??
      availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ??
      null
    );
  }, []);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        options.onEnd?.();
        return;
      }

      const chunks = splitTextForTTS(text);
      if (chunks.length === 0) {
        options.onEnd?.();
        return;
      }

      const runId = speakRunRef.current + 1;
      speakRunRef.current = runId;
      utteranceRef.current = null;
      clearKeepAlive();
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      options.onStart?.();

      keepAliveRef.current = window.setInterval(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 750);

      const finish = () => {
        if (speakRunRef.current !== runId) return;
        utteranceRef.current = null;
        clearKeepAlive();
        setIsSpeaking(false);
        options.onEnd?.();
      };

      const speakChunk = (index: number) => {
        if (speakRunRef.current !== runId) return;
        if (index >= chunks.length) {
          finish();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = "zh-CN";
        utterance.rate = options.rate ?? 1.08;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = 1;
        utterance.voice = getPreferredVoice(options.voiceURI);
        utteranceRef.current = utterance;
        utterance.onend = () => speakChunk(index + 1);
        utterance.onerror = () => {
          if (speakRunRef.current !== runId) return;
          utteranceRef.current = null;
          clearKeepAlive();
          setIsSpeaking(false);
          options.onError?.();
          options.onEnd?.();
        };

        window.speechSynthesis.speak(utterance);
      };

      window.setTimeout(() => speakChunk(0), 80);
    },
    [clearKeepAlive, getPreferredVoice],
  );

  const cancel = useCallback(() => {
    speakRunRef.current += 1;
    utteranceRef.current = null;
    clearKeepAlive();
    setIsSpeaking(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [clearKeepAlive]);

  return useMemo(
    () => ({
      cancel,
      isSpeaking,
      isSupported,
      speak,
      voices,
    }),
    [cancel, isSpeaking, isSupported, speak, voices],
  );
}
