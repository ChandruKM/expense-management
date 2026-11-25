"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { AutoDeductSummary } from "@/hooks/useWalletStore";
import { formatINR } from "@/utils/currency";

interface AutoDeductToastProps {
  summaries: AutoDeductSummary[];
  onDismiss: () => void;
}

export function AutoDeductToast({ summaries, onDismiss }: AutoDeductToastProps) {
  if (summaries.length === 0) return null;

  const totalDeducted = summaries.reduce((s, r) => s + r.total, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="fixed top-0 left-0 right-0 z-50 pt-safe px-4 pt-3 max-w-md mx-auto"
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-amber-500/35 rounded-2xl p-3.5 shadow-2xl shadow-black/60">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Zap size={15} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">
                  {formatINR(totalDeducted)} auto-deducted
                </p>
                <button
                  onClick={onDismiss}
                  className="btn-tap w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0"
                >
                  <X size={12} className="text-zinc-400" />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {summaries.map((s) => (
                  <span
                    key={s.ruleId}
                    className="inline-flex items-center gap-1 text-[11px] bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded-lg"
                  >
                    <span className="font-medium text-amber-300">{formatINR(s.total)}</span>
                    <span>
                      {s.days > 1 ? `${s.days}d ` : ""}
                      {s.ruleName}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
