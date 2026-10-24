"use client";

import { Button } from "@repo/ui/components/button";
import { MicIcon, MicOffIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionInstance extends EventTarget {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
}

const getSpeechRecognitionCtor = () => {
  if (globalThis.window === undefined) return;
  const win = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
};

export const FlowAgentSpeechInputButton = ({
  disabled,
  onTranscript,
}: {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const SpeechRecognitionCtor = getSpeechRecognitionCtor();

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = document.documentElement.lang || "en";

    const onResult = (event: Event) => {
      const speechEvent = event as Event & {
        results: {
          item: (index: number) => {
            item: (index: number) => { transcript: string };
          };
        };
      };
      const transcript = speechEvent.results
        .item(0)
        ?.item(0)
        ?.transcript?.trim();
      if (transcript) onTranscript(transcript);
      setListening(false);
    };
    const onStop = () => setListening(false);

    recognition.addEventListener("result", onResult);
    recognition.addEventListener("error", onStop);
    recognition.addEventListener("end", onStop);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognition.removeEventListener("result", onResult);
      recognition.removeEventListener("error", onStop);
      recognition.removeEventListener("end", onStop);
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionCtor, onTranscript]);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setListening(true);
    recognition.start();
  }, [listening]);

  if (!SpeechRecognitionCtor) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop listening" : "Start voice input"}
      onClick={toggle}
    >
      {listening ? <MicOffIcon /> : <MicIcon />}
    </Button>
  );
};
