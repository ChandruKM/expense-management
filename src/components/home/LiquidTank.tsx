"use client";

import { motion } from "framer-motion";
import {
  formatINR,
  toLifeHours,
  getSpendHealthColor,
  getDailySpendLimit,
  getRemainingDaysInMonth,
} from "@/utils/currency";

interface LiquidTankProps {
  spendBucket: number;
  initialSpendBucket: number;
  lifeHoursMode: boolean;
  hourlyRate: number;
}

export function LiquidTank({
  spendBucket,
  initialSpendBucket,
  lifeHoursMode,
  hourlyRate,
}: LiquidTankProps) {
  const fillPercent =
    initialSpendBucket > 0
      ? Math.max(0, Math.min(100, (spendBucket / initialSpendBucket) * 100))
      : 0;

  const healthColor = getSpendHealthColor(spendBucket, initialSpendBucket);
  const dailyLimit = getDailySpendLimit(spendBucket);
  const remainingDays = getRemainingDaysInMonth();

  const isHealthy = fillPercent > 50;
  const isCaution = fillPercent > 20 && fillPercent <= 50;

  const badgeStyle = isHealthy
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    : isCaution
    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
    : "bg-red-500/15 text-red-300 border-red-500/30";

  const statusText = isHealthy ? "Healthy" : isCaution ? "Caution" : "Low Funds";

  const displayDaily = lifeHoursMode
    ? toLifeHours(dailyLimit, hourlyRate)
    : formatINR(dailyLimit);

  const displayRemaining = lifeHoursMode
    ? toLifeHours(spendBucket, hourlyRate)
    : `${spendBucket < 0 ? "-" : ""}${formatINR(spendBucket)}`;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/90 p-5 shadow-xl shadow-black/40">
      {/* Full-card rising liquid background */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        animate={{ height: `${Math.max(12, fillPercent)}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ backgroundColor: healthColor + "18" }}
      >
        <svg
          className="absolute -top-3.5 wave-anim"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
          style={{ width: "200%", height: "18px" }}
        >
          <path
            d="M0,10 C30,20 70,0 100,10 C130,20 170,0 200,10 L200,20 L0,20 Z"
            fill={healthColor}
            opacity="0.28"
          />
        </svg>
        <svg
          className="absolute -top-2.5 wave-anim-slow"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
          style={{ width: "200%", height: "16px" }}
        >
          <path
            d="M0,8 C40,18 60,0 100,8 C140,18 160,0 200,8 L200,20 L0,20 Z"
            fill={healthColor}
            opacity="0.18"
          />
        </svg>
      </motion.div>

      {/* Foreground Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Daily Safe-to-Spend
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: healthColor }}
            />
            {statusText} · {Math.round(fillPercent)}%
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={displayDaily}
            initial={{ opacity: 0.5, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-white tabular-nums"
          >
            {displayDaily}
          </motion.span>
          {!lifeHoursMode && (
            <span className="text-sm font-medium text-zinc-400">/ day</span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="text-zinc-400">
            Pool:{" "}
            <span className="text-zinc-100 font-semibold tabular-nums">
              {displayRemaining}
            </span>
          </div>
          <div className="text-zinc-400 tabular-nums">
            <span className="text-zinc-100 font-semibold">{remainingDays}</span> days left
          </div>
        </div>
      </div>
    </div>
  );
}
