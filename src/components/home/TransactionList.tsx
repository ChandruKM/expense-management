"use client";

import { useState, useMemo } from "react";
import {
  Coffee,
  Utensils,
  Fuel,
  ShoppingBag,
  Bike,
  Receipt,
  Zap,
  Shield,
  ArrowDownLeft,
} from "lucide-react";
import { Transaction } from "@/types";
import { formatINR, isoDateString } from "@/utils/currency";

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
}

type DateFilter = "all" | "today" | "month";

const CATEGORY_ICON_MAP: Record<
  string,
  { Icon: typeof Coffee; bg: string }
> = {
  "Tea/Coffee": { Icon: Coffee, bg: "bg-amber-500/15 text-amber-400" },
  Food: { Icon: Utensils, bg: "bg-emerald-500/15 text-emerald-400" },
  Transport: { Icon: Fuel, bg: "bg-blue-500/15 text-blue-400" },
  Groceries: { Icon: ShoppingBag, bg: "bg-teal-500/15 text-teal-400" },
  "Food Delivery / Junk": { Icon: Bike, bg: "bg-violet-500/15 text-violet-400" },
  Bills: { Icon: Receipt, bg: "bg-sky-500/15 text-sky-400" },
};

function getRowVisual(tx: Transaction) {
  if (tx.type === "auto") {
    return { Icon: Zap, bg: "bg-amber-500/15 text-amber-400", amount: "text-amber-300" };
  }
  if (tx.type === "self-tax") {
    return { Icon: Shield, bg: "bg-violet-500/15 text-violet-400", amount: "text-violet-300" };
  }
  const cat = CATEGORY_ICON_MAP[tx.category];
  if (cat) {
    return { Icon: cat.Icon, bg: cat.bg, amount: "text-white" };
  }
  return { Icon: ArrowDownLeft, bg: "bg-zinc-800 text-zinc-300", amount: "text-white" };
}

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

function shortCatLabel(cat: string): string {
  if (cat === "Food Delivery / Junk") return "Junk Food";
  if (cat === "Self-Tax Penalty") return "Self-Tax";
  return cat;
}

export function TransactionList({
  transactions,
  limit,
}: TransactionListProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  // All expenses in LIFO order
  const allExpenses = useMemo(() => {
    return [...transactions]
      .reverse()
      .filter((t) => t.amount < 0)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions]);

  const overallTotal = useMemo(
    () => allExpenses.reduce((s, t) => s + Math.abs(t.amount), 0),
    [allExpenses]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const tx of allExpenses) {
      set.add(tx.category);
    }
    return Array.from(set);
  }, [allExpenses]);

  const todayStr = isoDateString(new Date());
  const monthPrefix = todayStr.slice(0, 7);

  const filtered = useMemo(() => {
    return allExpenses.filter((tx) => {
      if (dateFilter === "today" && tx.date !== todayStr) return false;
      if (dateFilter === "month" && !tx.date.startsWith(monthPrefix)) return false;
      if (catFilter !== "all" && tx.category !== catFilter) return false;
      return true;
    });
  }, [allExpenses, dateFilter, catFilter, todayStr, monthPrefix]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, t) => s + Math.abs(t.amount), 0),
    [filtered]
  );

  const displayList = limit ? filtered.slice(0, limit) : filtered;
  const isFiltered = dateFilter !== "all" || catFilter !== "all";

  if (allExpenses.length === 0) {
    return (
      <div className="surface-inset text-center py-6 text-zinc-500 text-xs">
        No spending yet
      </div>
    );
  }

  const groups: { date: string; items: Transaction[]; total: number }[] = [];
  for (const tx of displayList) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) {
      last.items.push(tx);
      last.total += Math.abs(tx.amount);
    } else {
      groups.push({ date: tx.date, items: [tx], total: Math.abs(tx.amount) });
    }
  }

  return (
    <div className="space-y-3">
      {/* Totals Summary + Date Filter */}
      <div className="surface-inset p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs tabular-nums">
            <div>
              <span className="text-zinc-500">Total </span>
              <span className="text-white font-bold">{formatINR(overallTotal)}</span>
            </div>
            {isFiltered && (
              <>
                <span className="text-zinc-700">·</span>
                <div>
                  <span className="text-emerald-400/80">Filtered </span>
                  <span className="text-emerald-400 font-bold">
                    {formatINR(filteredTotal)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Date Scope Pills */}
          <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80 text-[10px] font-semibold">
            {(
              [
                { id: "all", label: "All" },
                { id: "today", label: "Today" },
                { id: "month", label: "Month" },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`btn-tap px-2 py-1 rounded-md transition-colors ${
                  dateFilter === d.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCatFilter("all")}
              className={`btn-tap flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                catFilter === "all"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-950/70 border-zinc-800 text-zinc-400"
              }`}
            >
              All ({allExpenses.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`btn-tap flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  catFilter === cat
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-zinc-950/70 border-zinc-800 text-zinc-400"
                }`}
              >
                {shortCatLabel(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grouped LIFO List */}
      {groups.length === 0 ? (
        <div className="surface-inset text-center py-6 text-zinc-500 text-xs">
          No matching expenses
        </div>
      ) : (
        <div className="space-y-3.5">
          {groups.map((group) => (
            <div key={group.date} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-400">
                  {formatDateHeading(group.date)}
                </span>
                <span className="text-xs font-semibold text-zinc-500 tabular-nums">
                  -{formatINR(group.total)}
                </span>
              </div>

              <div className="surface-inset divide-y divide-zinc-800/60 overflow-hidden">
                {group.items.map((tx) => {
                  const { Icon, bg, amount } = getRowVisual(tx);

                  return (
                    <div key={tx.id} className="px-3.5 py-3 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}
                      >
                        <Icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white truncate">
                            {tx.note}
                          </span>
                          {tx.isAuto && (
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">
                              AUTO
                            </span>
                          )}
                          {tx.type === "self-tax" && (
                            <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded flex-shrink-0">
                              TAX
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {shortCatLabel(tx.category)}
                        </div>
                      </div>

                      <div
                        className={`text-sm font-bold tabular-nums flex-shrink-0 ${amount}`}
                      >
                        -{formatINR(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
