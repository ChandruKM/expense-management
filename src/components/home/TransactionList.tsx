"use client";

import { ArrowUpRight, ArrowDownLeft, Zap, Shield } from "lucide-react";
import { Transaction, BUCKET_LABELS, BucketKey } from "@/types";
import { formatINR, toLifeHours } from "@/utils/currency";

interface TransactionListProps {
  transactions: Transaction[];
  lifeHoursMode: boolean;
  hourlyRate: number;
  limit?: number;
}

const TYPE_STYLES = {
  income: {
    Icon: ArrowUpRight,
    bg: "bg-emerald-500/15 text-emerald-400",
    amount: "text-emerald-400",
  },
  expense: {
    Icon: ArrowDownLeft,
    bg: "bg-zinc-800 text-zinc-300",
    amount: "text-zinc-100",
  },
  auto: {
    Icon: Zap,
    bg: "bg-amber-500/15 text-amber-400",
    amount: "text-amber-400",
  },
  "self-tax": {
    Icon: Shield,
    bg: "bg-violet-500/15 text-violet-400",
    amount: "text-violet-400",
  },
};

function formatDateHeading(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txDate = new Date(iso + "T00:00:00");
  txDate.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - txDate.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return txDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function TransactionList({
  transactions,
  lifeHoursMode,
  hourlyRate,
  limit = 15,
}: TransactionListProps) {
  const sorted = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="surface-inset text-center py-10 text-zinc-500 text-sm">
        No transactions yet · Tap Deduct or 1-Tap above
      </div>
    );
  }

  // Group by date
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const tx of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) {
      last.items.push(tx);
    } else {
      groups.push({ date: tx.date, items: [tx] });
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.date} className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
            {formatDateHeading(group.date)}
          </div>
          <div className="surface-inset divide-y divide-zinc-800/70 overflow-hidden">
            {group.items.map((tx) => {
              const style = TYPE_STYLES[tx.type];
              const Icon = style.Icon;
              const valText = lifeHoursMode
                ? toLifeHours(tx.amount, hourlyRate).replace(" of work", "")
                : formatINR(tx.amount);

              return (
                <div
                  key={tx.id}
                  className="px-3.5 py-3 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">
                        {tx.note}
                      </span>
                      {tx.isAuto && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                          AUTO
                        </span>
                      )}
                      {tx.type === "self-tax" && (
                        <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                          TAX
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {tx.category} · {BUCKET_LABELS[tx.bucket as BucketKey]}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums flex-shrink-0 ${style.amount}`}
                  >
                    {tx.amount > 0 ? "+" : "-"}
                    {valText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
