"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  CreditCard,
  Lock,
  Calendar,
  Clock,
} from "lucide-react";
import { AutoRule, Buckets, BucketKey } from "@/types";
import { formatINR, isoDateString } from "@/utils/currency";

interface ForecastTabProps {
  buckets: Buckets;
  autoRules: AutoRule[];
  monthlyIncome: number;
}

const BUCKET_META: Record<
  BucketKey,
  { label: string; Icon: typeof Home; iconColor: string; barColor: string }
> = {
  needs: { label: "Needs", Icon: Home, iconColor: "text-blue-400", barColor: "bg-blue-500" },
  spend: { label: "Spend", Icon: CreditCard, iconColor: "text-emerald-400", barColor: "bg-emerald-500" },
  savings: { label: "Vault", Icon: Lock, iconColor: "text-violet-400", barColor: "bg-violet-500" },
};

const HORIZON_PRESETS = [7, 14, 30, 60];

function simulateFuture(
  buckets: Buckets,
  rules: AutoRule[],
  days: number
): { date: string; buckets: Buckets; total: number }[] {
  const results: { date: string; buckets: Buckets; total: number }[] = [];
  const cur: Buckets = { ...buckets };

  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = isoDateString(date);
    const dayOfMonth = date.getDate();

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.frequency === "daily") {
        cur[rule.bucket] = cur[rule.bucket] - rule.amount;
      } else if (rule.frequency === "monthly" && rule.dayOfMonth === dayOfMonth) {
        cur[rule.bucket] = cur[rule.bucket] - rule.amount;
      }
    }

    const total = cur.needs + cur.spend + cur.savings;
    results.push({ date: dateStr, buckets: { ...cur }, total });
  }
  return results;
}

export function ForecastTab({ buckets, autoRules }: ForecastTabProps) {
  const [sliderDays, setSliderDays] = useState(14);

  const forecast = useMemo(
    () => simulateFuture(buckets, autoRules, 60),
    [buckets, autoRules]
  );

  const currentTotal = buckets.needs + buckets.spend + buckets.savings;
  const selectedDay = forecast[sliderDays - 1] || {
    buckets,
    date: isoDateString(new Date()),
    total: currentTotal,
  };

  const delta = selectedDay.total - currentTotal;

  const firstNegativeIndex = forecast.findIndex((f) =>
    Object.values(f.buckets).some((v) => v < 0)
  );
  const daysUntilDanger = firstNegativeIndex === -1 ? null : firstNegativeIndex + 1;

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // SVG Chart geometry
  const totals = forecast.map((f) => f.total);
  const maxVal = Math.max(...totals);
  const minVal = Math.min(...totals);
  const isFlat = maxVal === minVal;
  const range = isFlat ? 1 : maxVal - minVal;

  const W = 300;
  const H = 80;
  const points = totals.map((val, idx) => {
    const x = (idx / 59) * W;
    const y = isFlat
      ? H * 0.55
      : H - ((val - minVal) / range) * (H - 18) - 9;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const cursor = points[sliderDays - 1] || points[0];
  const zeroY = isFlat ? H * 0.55 : H - ((0 - minVal) / range) * (H - 18) - 9;
  const strokeColor =
    selectedDay.total < 0 || daysUntilDanger !== null ? "#f59e0b" : "#10b981";

  const bucketKeys: BucketKey[] = ["needs", "spend", "savings"];
  const positiveProjTotal = bucketKeys.reduce(
    (s, k) => s + Math.max(0, selectedDay.buckets[k]),
    0
  );

  const activeRules = autoRules.filter((r) => r.enabled);

  return (
    <div className="space-y-4">
      {/* 1. Hero Forecast & Interactive Chart Card */}
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 p-5 shadow-xl shadow-black/40 space-y-4">
        {/* Top Row: Date + Runway Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-zinc-400">
            {formatDate(selectedDay.date)} · <span className="text-zinc-200">+{sliderDays}d</span>
          </div>

          {daysUntilDanger !== null ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
              <AlertTriangle size={11} />
              Hits ₹0 in {daysUntilDanger}d
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 size={11} />
              60d Safe
            </span>
          )}
        </div>

        {/* Big Projected Value + Delta */}
        <div className="flex items-baseline justify-between gap-2">
          <div
            className={`text-4xl font-bold tracking-tight tabular-nums ${
              selectedDay.total < 0 ? "text-red-400" : "text-white"
            }`}
          >
            {selectedDay.total < 0 ? "-" : ""}
            {formatINR(selectedDay.total)}
          </div>
          {delta !== 0 && (
            <span
              className={`text-xs font-semibold tabular-nums ${
                delta < 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {delta < 0 ? "-" : "+"}
              {formatINR(delta)}
            </span>
          )}
        </div>

        {/* SVG Chart with subtle gridlines */}
        <div className="relative h-20 w-full">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal gridlines */}
            <line x1={0} y1={H * 0.25} x2={W} y2={H * 0.25} stroke="#27272a" strokeWidth="0.7" />
            <line x1={0} y1={H * 0.55} x2={W} y2={H * 0.55} stroke="#27272a" strokeWidth="0.7" />
            <line x1={0} y1={H * 0.85} x2={W} y2={H * 0.85} stroke="#27272a" strokeWidth="0.7" />

            {minVal < 0 && !isFlat && (
              <line
                x1={0}
                y1={zeroY}
                x2={W}
                y2={zeroY}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity="0.6"
              />
            )}

            <path d={areaPath} fill="url(#forecastGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {cursor && (
              <>
                <line
                  x1={cursor.x}
                  y1={0}
                  x2={cursor.x}
                  y2={H}
                  stroke="#ffffff"
                  strokeOpacity="0.25"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={cursor.x}
                  cy={cursor.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />
              </>
            )}
          </svg>
        </div>

        {/* Scrubber */}
        <input
          type="range"
          min={1}
          max={60}
          value={sliderDays}
          onChange={(e) => setSliderDays(parseInt(e.target.value))}
          className="w-full ios-slider cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${strokeColor} 0%, ${strokeColor} ${(sliderDays / 60) * 100}%, #27272a ${(sliderDays / 60) * 100}%, #27272a 100%)`,
          }}
        />

        {/* Quick Horizon Pills */}
        <div className="grid grid-cols-4 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/70">
          {HORIZON_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setSliderDays(d)}
              className={`btn-tap py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                sliderDays === d
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              +{d}d
            </button>
          ))}
        </div>
      </div>

      {/* 2. Unified 3-Bucket Projection Strip */}
      <div className="surface-inset overflow-hidden">
        <div className="h-1 w-full bg-zinc-800 flex">
          {bucketKeys.map((key) => {
            const w =
              positiveProjTotal > 0
                ? (Math.max(0, selectedDay.buckets[key]) / positiveProjTotal) * 100
                : 33.33;
            return (
              <div
                key={key}
                className={`h-full ${BUCKET_META[key].barColor} transition-all duration-200`}
                style={{ width: `${w}%` }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-3 divide-x divide-zinc-800/70">
          {bucketKeys.map((key) => {
            const projected = selectedDay.buckets[key];
            const isNeg = projected < 0;
            const { label, Icon, iconColor } = BUCKET_META[key];
            return (
              <div key={key} className="px-3.5 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={iconColor} />
                  <span className="text-[11px] font-medium text-zinc-400">{label}</span>
                </div>
                <div
                  className={`text-sm font-bold tabular-nums tracking-tight ${
                    isNeg ? "text-red-400" : "text-white"
                  }`}
                >
                  {isNeg ? "-" : ""}
                  {formatINR(projected)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Upcoming Deductions */}
      {activeRules.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-zinc-400 px-1">
            Upcoming in {sliderDays}d
          </div>
          <div className="surface-inset divide-y divide-zinc-800/60 overflow-hidden">
            {activeRules.map((rule) => {
              const count =
                rule.frequency === "daily"
                  ? sliderDays
                  : (() => {
                      let c = 0;
                      for (let i = 1; i <= sliderDays; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        if (d.getDate() === rule.dayOfMonth) c++;
                      }
                      return c;
                    })();
              if (count === 0) return null;
              const isMonthly = rule.frequency === "monthly";
              return (
                <div
                  key={rule.id}
                  className="px-3.5 py-3 flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isMonthly
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {isMonthly ? <Calendar size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {rule.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {count}× {isMonthly ? `monthly` : "daily"}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-rose-400 tabular-nums">
                    -{formatINR(rule.amount * count)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="surface-inset text-center py-4 text-zinc-500 text-xs">
          No active auto-deduct rules
        </div>
      )}
    </div>
  );
}
