"use client";

import { motion } from "framer-motion";
import {
  formatINR,
  getSpendHealthColor,
  getDailySpendLimit,
  getRemainingDaysInMonth,
} from "@/utils/currency";

interface LiquidTankProps {
  spendBucket: number;
  initialSpendBucket: number;
  totalSpent?: number;
}

export function LiquidTank({
  spendBucket,
  initialSpendBucket,
  totalSpent = 0,
}: LiquidTankProps) {
  const fillPercent =
    initialSpendBucket > 0
      ? Math.max(0, Math.min(100, (spendBucket / initialSpendBucket) * 100))
      : 0;

  const healthColor = getSpendHealthColor(spendBucket, initialSpendBucket);
  const dailyLimit = getDailySpendLimit(spendBucket);
  const remainingDays = getRemainingDaysInMonth();

  const statusLabel =
    fillPercent > 50 ? "Healthy" : fillPercent > 20 ? "Caution" : "Low";

  const displayDaily = formatINR(dailyLimit);
  const displayRemaining = `${spendBucket < 0 ? "-" : ""}${formatINR(spendBucket)}`;

  // Circular ring math
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (fillPercent / 100) * circumference;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 p-5 shadow-xl shadow-black/40">
      {/* Subtle rising liquid wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        animate={{ height: `${Math.max(10, fillPercent)}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ backgroundColor: healthColor + "14" }}
      >
        <svg
          className="absolute -top-3 wave-anim"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
          style={{ width: "200%", height: "14px" }}
        >
          <path
            d="M0,10 C30,20 70,0 100,10 C130,20 170,0 200,10 L200,20 L0,20 Z"
            fill={healthColor}
            opacity="0.25"
          />
        </svg>
      </motion.div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Limit & Pool */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">
              Today&apos;s Limit
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                color: healthColor,
                borderColor: healthColor + "40",
                backgroundColor: healthColor + "15",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: healthColor }}
              />
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
              {displayDaily}
            </span>
            <span className="text-sm font-medium text-zinc-400">/ day</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
            <span>
              Spent <strong className="text-rose-400 font-semibold">{formatINR(totalSpent)}</strong>
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              Left <strong className="text-zinc-200 font-semibold">{displayRemaining}</strong>
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              <strong className="text-zinc-200 font-semibold">{remainingDays}d</strong>
            </span>
          </div>
        </div>

        {/* Right: Circular Gauge Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth="4.5"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={healthColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <span
            className="absolute text-xs font-bold tabular-nums"
            style={{ color: healthColor }}
          >
            {Math.round(fillPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}
