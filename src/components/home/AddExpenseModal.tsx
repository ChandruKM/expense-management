"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { BucketKey } from "@/types";
import { formatINR } from "@/utils/currency";

interface AddExpenseModalProps {
  onAdd: (amount: number, category: string, note: string, bucket: BucketKey) => void;
}

const CATEGORIES = [
  "Food",
  "Tea/Coffee",
  "Transport",
  "Groceries",
  "Food Delivery / Junk",
  "Bills",
  "Shopping",
  "Other",
];

const PRESET_AMOUNTS = [50, 100, 200, 500];

export function AddExpenseModal({ onAdd }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [bucket, setBucket] = useState<BucketKey>("spend");

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = () => {
    if (parsedAmount <= 0) return;
    onAdd(parsedAmount, category, note.trim() || category, bucket);
    setAmount("");
    setNote("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-tap flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-sm"
      >
        <Plus size={18} strokeWidth={2.5} />
        Spend
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl pb-safe max-w-md mx-auto"
            >
              <div className="p-5 space-y-3.5">
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-1" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Add Expense</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="btn-tap w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                  >
                    <X size={16} className="text-zinc-400" />
                  </button>
                </div>

                {/* Amount */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-medium text-zinc-500">₹</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="text-4xl font-bold bg-transparent text-white outline-none w-full tabular-nums"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {PRESET_AMOUNTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setAmount(String(parsedAmount + p))}
                        className="btn-tap flex-1 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300"
                      >
                        +₹{p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`btn-tap px-3 py-1.5 rounded-xl text-xs font-medium border ${
                        category === c
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-zinc-950/70 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {c === "Food Delivery / Junk" ? "Junk Food" : c}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-2.5 outline-none placeholder:text-zinc-600"
                />

                {/* Bucket */}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "needs", label: "Needs" },
                      { id: "spend", label: "Spend" },
                      { id: "savings", label: "Vault" },
                    ] as const
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setBucket(id)}
                      className={`btn-tap py-2 rounded-xl text-xs font-semibold border ${
                        bucket === id
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-zinc-950/70 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={parsedAmount <= 0}
                  className="btn-tap w-full py-3.5 rounded-2xl bg-emerald-500 disabled:opacity-40 text-zinc-950 font-bold text-sm"
                >
                  {parsedAmount > 0 ? `Deduct ${formatINR(parsedAmount)}` : "Enter Amount"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
