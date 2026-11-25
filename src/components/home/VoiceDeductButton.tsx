"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";

interface VoiceDeductButtonProps {
  onDeduct: (amount: number, category: string, note: string) => void;
}

interface MySpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: ((this: MySpeechRecognition, ev: Event) => unknown) | null;
  onresult: ((this: MySpeechRecognition, ev: MySpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: MySpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: MySpeechRecognition, ev: Event) => unknown) | null;
}

interface MySpeechRecognitionEvent extends Event {
  results: { 0: { 0: { transcript: string } } };
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => MySpeechRecognition;
    SpeechRecognition: new () => MySpeechRecognition;
  }
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  tea: "Tea/Coffee",
  coffee: "Tea/Coffee",
  chai: "Tea/Coffee",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  food: "Food",
  petrol: "Transport",
  fuel: "Transport",
  auto: "Transport",
  rickshaw: "Transport",
  uber: "Transport",
  ola: "Transport",
  grocery: "Groceries",
  groceries: "Groceries",
  vegetables: "Groceries",
  swiggy: "Food Delivery / Junk",
  zomato: "Food Delivery / Junk",
  delivery: "Food Delivery / Junk",
  movie: "Entertainment",
  medicine: "Healthcare",
  doctor: "Healthcare",
  electricity: "Bills",
  phone: "Bills",
  recharge: "Bills",
};

function parseVoiceInput(text: string): { amount: number; category: string; note: string } | null {
  const numMatch = text.match(/\d+(\.\d+)?/);
  if (!numMatch) return null;
  const amount = parseFloat(numMatch[0]);
  if (isNaN(amount) || amount <= 0) return null;

  const lower = text.toLowerCase();
  let category = "Expense";
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      category = cat;
      break;
    }
  }

  return { amount, category, note: text };
}

export function VoiceDeductButton({ onDeduct }: VoiceDeductButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "parsed" | "error">("idle");
  const recognitionRef = useRef<MySpeechRecognition | null>(null);
  const statusRef = useRef<"idle" | "listening" | "parsed" | "error">("idle");

  const updateStatus = (next: "idle" | "listening" | "parsed" | "error") => {
    statusRef.current = next;
    setStatus(next);
  };

  const startListening = useCallback(() => {
    const SpeechRec = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRec) {
      updateStatus("error");
      setTranscript("Voice not supported here");
      setTimeout(() => {
        updateStatus("idle");
        setTranscript("");
      }, 2200);
      return;
    }

    const recognition = new SpeechRec();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      updateStatus("listening");
      setTranscript('Say "Lunch 150"...');
    };

    recognition.onresult = (event: MySpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const parsed = parseVoiceInput(text);
      if (parsed) {
        updateStatus("parsed");
        setTimeout(() => {
          onDeduct(parsed.amount, parsed.category, parsed.note);
          updateStatus("idle");
          setTranscript("");
          setIsListening(false);
        }, 700);
      } else {
        updateStatus("error");
        setTranscript("Couldn't parse: " + text);
        setTimeout(() => {
          updateStatus("idle");
          setTranscript("");
          setIsListening(false);
        }, 2000);
      }
    };

    recognition.onerror = () => {
      updateStatus("error");
      setTranscript("Voice error. Try again.");
      setIsListening(false);
      setTimeout(() => {
        updateStatus("idle");
        setTranscript("");
      }, 2000);
    };

    recognition.onend = () => {
      if (statusRef.current === "listening") {
        setIsListening(false);
        updateStatus("idle");
        setTranscript("");
      }
    };

    recognition.start();
  }, [onDeduct]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    updateStatus("idle");
    setTranscript("");
  }, []);

  const btnStyle =
    status === "listening"
      ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/25"
      : status === "parsed"
      ? "bg-emerald-500 border-emerald-400 text-zinc-950"
      : status === "error"
      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
      : "bg-zinc-900 border-zinc-800 text-zinc-200";

  return (
    <div className="relative">
      <button
        onClick={isListening ? stopListening : startListening}
        aria-label="Voice Deduct"
        className={`btn-tap h-12 px-4 rounded-2xl border flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${btnStyle}`}
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            <MicOff size={18} />
          </motion.div>
        ) : (
          <Mic size={18} className={status === "idle" ? "text-emerald-400" : ""} />
        )}
        <span>{isListening ? "Stop" : "Voice"}</span>
      </button>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className={`absolute right-0 bottom-14 z-30 flex items-center gap-2 px-3 py-2 rounded-xl text-xs whitespace-nowrap shadow-xl border ${
              status === "parsed"
                ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
                : status === "error"
                ? "bg-amber-950/95 border-amber-500/40 text-amber-200"
                : "bg-zinc-900/95 border-zinc-700 text-zinc-200"
            }`}
          >
            <span>{transcript}</span>
            <button
              onClick={() => {
                setTranscript("");
                updateStatus("idle");
              }}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
