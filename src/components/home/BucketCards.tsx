"use client";

import { Home, CreditCard, Lock } from "lucide-react";
import { Buckets, BucketKey } from "@/types";
import { formatINR } from "@/utils/currency";

interface BucketCardsProps {
  buckets: Buckets;
}

const BUCKET_META: Record<
  BucketKey,
  {
    short: string;
    Icon: typeof Home;
    dotColor: string;
    barColor: string;
    valueColor: string;
  }
> = {
  needs: {
    short: "Needs",
    Icon: Home,
    dotColor: "text-blue-400",
    barColor: "bg-blue-500",
    valueColor: "text-white",
  },
  spend: {
    short: "Spend",
    Icon: CreditCard,
    dotColor: "text-emerald-400",
    barColor: "bg-emerald-500",
    valueColor: "text-emerald-400",
  },
  savings: {
    short: "Vault",
    Icon: Lock,
    dotColor: "text-violet-400",
    barColor: "bg-violet-500",
    valueColor: "text-violet-300",
  },
};

export function BucketCards({ buckets }: BucketCardsProps) {
  const keys: BucketKey[] = ["needs", "spend", "savings"];
  const positiveTotal = keys.reduce((s, k) => s + Math.max(0, buckets[k]), 0);

  return (
    <div className="surface-inset overflow-hidden">
      {/* Top 3-Color Ratio Strip */}
      <div className="h-1 w-full bg-zinc-800 flex">
        {keys.map((key) => {
          const w =
            positiveTotal > 0
              ? (Math.max(0, buckets[key]) / positiveTotal) * 100
              : 33.33;
          return (
            <div
              key={key}
              className={`h-full ${BUCKET_META[key].barColor} transition-all duration-300`}
              style={{ width: `${w}%` }}
            />
          );
        })}
      </div>

      {/* Unified 3-Column Strip (no nested boxes) */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800/70">
        {keys.map((key) => {
          const val = buckets[key];
          const { short, Icon, dotColor, valueColor } = BUCKET_META[key];
          const formatted = `${val < 0 ? "-" : ""}${formatINR(val)}`;

          return (
            <div key={key} className="px-3.5 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={dotColor} />
                <span className="text-[11px] font-medium text-zinc-400">
                  {short}
                </span>
              </div>
              <div
                className={`text-sm font-bold tabular-nums tracking-tight ${
                  val < 0 ? "text-red-400" : valueColor
                }`}
              >
                {formatted}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
