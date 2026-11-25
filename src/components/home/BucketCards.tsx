"use client";

import { Home, CreditCard, Lock } from "lucide-react";
import { Buckets, BucketKey } from "@/types";
import { formatINR, toLifeHours } from "@/utils/currency";

interface BucketCardsProps {
  buckets: Buckets;
  lifeHoursMode: boolean;
  hourlyRate: number;
}

const BUCKET_META: Record<
  BucketKey,
  {
    short: string;
    Icon: typeof Home;
    iconBg: string;
    barColor: string;
    valueColor: string;
  }
> = {
  needs: {
    short: "Needs",
    Icon: Home,
    iconBg: "bg-blue-500/15 text-blue-400",
    barColor: "bg-blue-500",
    valueColor: "text-blue-400",
  },
  spend: {
    short: "Spend",
    Icon: CreditCard,
    iconBg: "bg-emerald-500/15 text-emerald-400",
    barColor: "bg-emerald-500",
    valueColor: "text-emerald-400",
  },
  savings: {
    short: "Vault",
    Icon: Lock,
    iconBg: "bg-violet-500/15 text-violet-400",
    barColor: "bg-violet-500",
    valueColor: "text-violet-400",
  },
};

export function BucketCards({ buckets, lifeHoursMode, hourlyRate }: BucketCardsProps) {
  const keys: BucketKey[] = ["needs", "spend", "savings"];
  const positiveTotal = keys.reduce((s, k) => s + Math.max(0, buckets[k]), 0);

  return (
    <div className="surface-inset p-3.5 space-y-3">
      {/* Proportional Allocation Bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden flex gap-0.5">
        {keys.map((key) => {
          const w =
            positiveTotal > 0
              ? (Math.max(0, buckets[key]) / positiveTotal) * 100
              : 33.3;
          return (
            <div
              key={key}
              className={`h-full ${BUCKET_META[key].barColor} transition-all duration-300`}
              style={{ width: `${w}%` }}
            />
          );
        })}
      </div>

      {/* 3 Bucket Columns */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => {
          const val = buckets[key];
          const { short, Icon, iconBg, valueColor } = BUCKET_META[key];
          const formatted = lifeHoursMode
            ? toLifeHours(val, hourlyRate).replace(" of work", "")
            : `${val < 0 ? "-" : ""}${formatINR(val)}`;

          return (
            <div
              key={key}
              className="rounded-xl bg-zinc-950/60 border border-zinc-800/60 p-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon size={13} />
                </div>
                <span className="text-[11px] font-medium text-zinc-400">{short}</span>
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
