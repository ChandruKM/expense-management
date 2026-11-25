"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, TrendingDown, Calendar } from "lucide-react";
import { AutoRule, Buckets, BucketKey, BUCKET_LABELS } from "@/types";
import { formatINR, toLifeHours, isoDateString } from "@/utils/currency";

interface ForecastTabProps {
  buckets: Buckets;
  autoRules: AutoRule[];
  monthlyIncome: number;
  lifeHoursMode: boolean;
  hourlyRate: number;
}

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
    results.push({
      date: dateStr,
      buckets: { ...cur },
      total,
    });
  }
  return results;
}

export function ForecastTab({
  buckets,
  autoRules,
  lifeHoursMode,
  hourlyRate,
}: ForecastTabProps) {
  const [sliderDays, setSliderDays] = useState(14);

  const forecast = useMemo(
    () => simulateFuture(buckets, autoRules, 60),
    [buckets, autoRules]
  );

  const selectedDay = forecast[sliderDays - 1] || {
    buckets,
    date: isoDateString(new Date()),
    total: buckets.needs + buckets.spend + buckets.savings,
  };

  const firstNegativeIndex = forecast.findIndex((f) =>
    Object.values(f.buckets).some((v) => v < 0)
  );
  const daysUntilDanger = firstNegativeIndex === -1 ? null : firstNegativeIndex + 1;

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  };

  const formatVal = (val: number) =>
    lifeHoursMode ? toLifeHours(val, hourlyRate).replace(" of work", "") : formatINR(val);

  // SVG Sparkline geometry
  const totals = forecast.map((f) => f.total);
  const maxVal = Math.max(...totals, 1);
  const minVal = Math.min(...totals, 0);
  const range = Math.max(maxVal - minVal, 1);

  const W = 300;
  const H = 90;
  const points = totals.map((val, idx) => {
    const x = (idx / 59) * W;
    const y = H - ((val - minVal) / range) * (H - 16) - 8;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const cursor = points[sliderDays - 1] || points[0];
  const zeroY = H - ((0 - minVal) / range) * (H - 16) - 8;
  const strokeColor = selectedDay.total < 0 || daysUntilDanger !== null ? "#f59e0b" : "#10b981";

  return (
    <div className="space-y-4">
      {/* Runway Status Pill */}
      {daysUntilDanger !== null ? (
        <div className="surface-inset p-3.5 border-red-500/35 bg-red-500/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">
              Hits ₹0 in {daysUntilDanger} days
            </div>
            <div className="text-[11px] text-zinc-400">
              {formatDate(forecast[firstNegativeIndex].date)} · Adjust rules or add income
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-inset p-3.5 border-emerald-500/25 bg-emerald-500/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">60-Day Runway Clear</div>
            <div className="text-[11px] text-zinc-400">
              All buckets stay positive with current auto-rules
            </div>
          </div>
        </div>
      )}

      {/* Ghost Timeline + Interactive Chart */}
      <div className="surface-card p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Calendar size={11} />
              Ghost Timeline · +{sliderDays}d
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {formatDate(selectedDay.date)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-zinc-500">Projected Net</div>
            <div
              className={`text-lg font-bold tabular-nums ${
                selectedDay.total < 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {selectedDay.total < 0 ? "-" : ""}
              {formatVal(selectedDay.total)}
            </div>
          </div>
        </div>

        {/* 60-Day SVG Curve */}
        <div className="relative h-24 w-full">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {minVal < 0 && (
              <line
                x1={0}
                y1={zeroY}
                x2={W}
                y2={zeroY}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity="0.5"
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
        <div>
          <input
            type="range"
            min={1}
            max={60}
            value={sliderDays}
            onChange={(e) => setSliderDays(parseInt(e.target.value))}
            className="w-full ios-slider cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(sliderDays / 60) * 100}%, #27272a ${(sliderDays / 60) * 100}%, #27272a 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-medium text-zinc-500 mt-1.5">
            <span>+1d</span>
            <span>+30d</span>
            <span>+60d</span>
          </div>
        </div>

        {/* Projected Bucket Bars */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
          {(["needs", "spend", "savings"] as BucketKey[]).map((key) => {
            const projected = selectedDay.buckets[key];
            const isNeg = projected < 0;
            const pct = Math.max(0, Math.min(100, (projected / (buckets[key] || 1)) * 100));
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{BUCKET_LABELS[key]}</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      isNeg ? "text-red-400" : "text-white"
                    }`}
                  >
                    {isNeg ? "-" : ""}
                    {formatVal(projected)}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      isNeg
                        ? "bg-red-500"
                        : key === "needs"
                        ? "bg-blue-500"
                        : key === "spend"
                        ? "bg-emerald-500"
                        : "bg-violet-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Deductions */}
      <div className="surface-inset p-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5">
          <TrendingDown size={12} />
          Scheduled in next {sliderDays} days
        </div>
        <div className="divide-y divide-zinc-800/70">
          {autoRules
            .filter((r) => r.enabled)
            .map((rule) => {
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
              const total = rule.amount * count;
              if (count === 0) return null;
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="text-sm text-white font-medium">{rule.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {count}×{" "}
                      {rule.frequency === "daily"
                        ? "daily"
                        : `monthly (day ${rule.dayOfMonth})`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-red-400 tabular-nums">
                    -{formatVal(total)}
                  </div>
                </div>
              );
            })}
          {autoRules.filter((r) => r.enabled).length === 0 && (
            <div className="text-zinc-500 text-sm text-center py-2">No active rules</div>
          )}
        </div>
      </div>
    </div>
  );
}
