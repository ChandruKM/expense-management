"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  Upload,
  RefreshCw,
  IndianRupee,
  Clock,
  ChevronRight,
  Wallet,
  Home,
  CreditCard,
  Lock,
  Check,
} from "lucide-react";
import { BucketSplit, BucketKey } from "@/types";
import { formatINR } from "@/utils/currency";

interface SettingsTabProps {
  monthlyIncome: number;
  hourlyRate: number;
  bucketSplit: BucketSplit;
  onAddIncome: (amount: number, category: string, note: string) => void;
  onUpdateSplit: (split: BucketSplit) => void;
  onUpdateHourlyRate: (rate: number) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

const SPLIT_META: Record<
  BucketKey,
  { label: string; Icon: typeof Home; color: string; hex: string }
> = {
  needs: { label: "Fixed Needs", Icon: Home, color: "text-blue-400", hex: "#3b82f6" },
  spend: { label: "Safe-to-Spend", Icon: CreditCard, color: "text-emerald-400", hex: "#10b981" },
  savings: { label: "Savings Vault", Icon: Lock, color: "text-violet-400", hex: "#8b5cf6" },
};

export function SettingsTab({
  hourlyRate,
  bucketSplit,
  onAddIncome,
  onUpdateSplit,
  onUpdateHourlyRate,
  onExport,
  onImport,
  onReset,
}: SettingsTabProps) {
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("Monthly Salary");
  const [localSplit, setLocalSplit] = useState(bucketSplit);
  const [localHourly, setLocalHourly] = useState(String(hourlyRate));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSplit(bucketSplit);
  }, [bucketSplit]);

  useEffect(() => {
    setLocalHourly(String(hourlyRate));
  }, [hourlyRate]);

  const totalSplit = localSplit.needs + localSplit.spend + localSplit.savings;
  const parsedIncome = parseFloat(incomeAmount) || 0;

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 1800);
  };

  const handleAddIncome = () => {
    if (parsedIncome <= 0) return;
    onAddIncome(parsedIncome, "Salary", incomeNote.trim() || "Income");
    setIncomeAmount("");
    flashNotice("Income split & added!");
  };

  const handleSaveSplit = () => {
    if (totalSplit !== 100) {
      alert("Split percentages must add up to 100%");
      return;
    }
    onUpdateSplit(localSplit);
    flashNotice("Split saved!");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onImport(ev.target?.result as string);
      flashNotice("Backup restored!");
    };
    reader.readAsText(file);
  };

  const bucketKeys: BucketKey[] = ["needs", "spend", "savings"];

  return (
    <div className="space-y-4">
      {savedNotice && (
        <div className="surface-inset px-3.5 py-2.5 border-emerald-500/40 bg-emerald-500/10 flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <Check size={14} />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Income Auto-Splitter */}
      <section className="surface-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Wallet size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Add & Auto-Split Income</h3>
            <p className="text-[11px] text-zinc-500">Splits automatically into your 3 buckets</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            placeholder="₹ Amount"
            className="col-span-2 bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder:text-zinc-600 tabular-nums"
          />
          <input
            type="text"
            value={incomeNote}
            onChange={(e) => setIncomeNote(e.target.value)}
            placeholder="Source label"
            className="col-span-3 bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder:text-zinc-600"
          />
        </div>

        {/* Live Split Preview */}
        {parsedIncome > 0 && (
          <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 tabular-nums">
            <div>
              <span className="text-zinc-500">Needs: </span>
              <span className="text-blue-400 font-semibold">
                {formatINR(Math.round((parsedIncome * localSplit.needs) / 100))}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Spend: </span>
              <span className="text-emerald-400 font-semibold">
                {formatINR(Math.round((parsedIncome * localSplit.spend) / 100))}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Vault: </span>
              <span className="text-violet-400 font-semibold">
                {formatINR(Math.round((parsedIncome * localSplit.savings) / 100))}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleAddIncome}
          disabled={parsedIncome <= 0}
          className="btn-tap w-full py-3 rounded-xl bg-emerald-500 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center justify-center gap-1.5"
        >
          <IndianRupee size={15} strokeWidth={2.5} />
          {parsedIncome > 0 ? `Split & Add ${formatINR(parsedIncome)}` : "Add Income"}
        </button>
      </section>

      {/* Bucket Split Ratio */}
      <section className="surface-inset p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Bucket Split Ratio</h3>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
              totalSplit === 100
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {totalSplit}% / 100%
          </span>
        </div>

        {/* Visual Ratio Bar */}
        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex gap-0.5">
          {bucketKeys.map((k) => (
            <div
              key={k}
              className="h-full transition-all duration-150"
              style={{
                width: `${Math.min(100, localSplit[k])}%`,
                backgroundColor: SPLIT_META[k].hex,
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {bucketKeys.map((key) => {
            const { label, Icon, color, hex } = SPLIT_META[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Icon size={13} className={color} />
                    {label}
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {localSplit[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={localSplit[key]}
                  onChange={(e) =>
                    setLocalSplit({ ...localSplit, [key]: parseInt(e.target.value) })
                  }
                  className="w-full ios-slider cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${hex} 0%, ${hex} ${localSplit[key]}%, #27272a ${localSplit[key]}%, #27272a 100%)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSaveSplit}
          className="btn-tap w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
        >
          Save Split Percentages
        </button>
      </section>

      {/* Life Hours Rate */}
      <section className="surface-inset p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Hourly Rate (Life Hours)</h3>
          </div>
          <span className="text-xs font-semibold text-amber-400 tabular-nums">
            {formatINR(hourlyRate)}/hr
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={localHourly}
            onChange={(e) => setLocalHourly(e.target.value)}
            placeholder="250"
            className="flex-1 bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none tabular-nums"
          />
          <button
            onClick={() => {
              onUpdateHourlyRate(parseFloat(localHourly) || hourlyRate);
              flashNotice("Hourly rate updated!");
            }}
            className="btn-tap px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold"
          >
            Update
          </button>
        </div>
      </section>

      {/* iOS-grouped Backup & Reset */}
      <section className="surface-inset divide-y divide-zinc-800/70 overflow-hidden">
        <button
          onClick={onExport}
          className="btn-tap w-full flex items-center justify-between px-4 py-3.5 text-sm text-zinc-200"
        >
          <span className="flex items-center gap-2.5">
            <Download size={16} className="text-emerald-400" />
            Export JSON Backup
          </span>
          <ChevronRight size={16} className="text-zinc-600" />
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="btn-tap w-full flex items-center justify-between px-4 py-3.5 text-sm text-zinc-200"
        >
          <span className="flex items-center gap-2.5">
            <Upload size={16} className="text-blue-400" />
            Import JSON Backup
          </span>
          <ChevronRight size={16} className="text-zinc-600" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-tap w-full flex items-center justify-between px-4 py-3.5 text-sm text-red-400"
          >
            <span className="flex items-center gap-2.5">
              <RefreshCw size={16} />
              Reset / Start Fresh
            </span>
            <ChevronRight size={16} className="text-red-400/50" />
          </button>
        ) : (
          <div className="p-3 flex gap-2 bg-red-500/5">
            <button
              onClick={() => {
                onReset();
                setShowResetConfirm(false);
                flashNotice("Reset to sample data");
              }}
              className="btn-tap flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="btn-tap flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      <div className="text-center text-[11px] text-zinc-600 py-1">
        FlowWallet · 100% Client-Side · Stored on Device
      </div>
    </div>
  );
}
