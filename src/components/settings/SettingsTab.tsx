"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  RefreshCw,
  IndianRupee,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  Sliders,
} from "lucide-react";
import { BucketSplit, BucketKey, Transaction } from "@/types";
import { formatINR, isoDateString } from "@/utils/currency";

interface SettingsTabProps {
  monthlyIncome: number;
  bucketSplit: BucketSplit;
  spendBalance: number;
  totalBalance: number;
  transactions: Transaction[];
  onAddIncome: (amount: number, category: string, note: string) => void;
  onUpdateSplit: (split: BucketSplit) => void;
  onRebalanceBuckets: (split: BucketSplit) => void;
  onTransferToVault: (amount: number) => void;
  onExportPDF: () => void;
  onReset: () => void;
}

const SPLIT_META: Record<BucketKey, { label: string; hex: string; text: string }> = {
  needs: { label: "Needs", hex: "#3b82f6", text: "text-blue-400" },
  spend: { label: "Spend", hex: "#10b981", text: "text-emerald-400" },
  savings: { label: "Vault", hex: "#8b5cf6", text: "text-violet-400" },
};

const INCOME_PRESETS = [5000, 10000, 25000, 40000];
const VAULT_PRESETS = [500, 1000, 2000];
const SPLIT_PRESETS: { name: string; split: BucketSplit }[] = [
  { name: "Balanced", split: { needs: 50, spend: 30, savings: 20 } },
  { name: "Saver", split: { needs: 60, spend: 20, savings: 20 } },
  { name: "Flexible", split: { needs: 40, spend: 40, savings: 20 } },
];

export function SettingsTab({
  bucketSplit,
  spendBalance,
  totalBalance,
  transactions,
  onAddIncome,
  onUpdateSplit,
  onRebalanceBuckets,
  onTransferToVault,
  onExportPDF,
  onReset,
}: SettingsTabProps) {
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("Salary");
  const [localSplit, setLocalSplit] = useState(bucketSplit);
  const [showSliders, setShowSliders] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setLocalSplit(bucketSplit);
  }, [bucketSplit]);

  const totalSplit = localSplit.needs + localSplit.spend + localSplit.savings;
  const parsedIncome = parseFloat(incomeAmount) || 0;

  // Amount used for live split preview: typed income if > 0, else current net balance
  const previewBase = parsedIncome > 0 ? parsedIncome : Math.max(0, totalBalance);
  const previewNeeds = Math.round((previewBase * localSplit.needs) / 100);
  const previewSpend = Math.round((previewBase * localSplit.spend) / 100);
  const previewVault = previewBase - previewNeeds - previewSpend;

  // Monthly In / Out stats (local calendar month)
  const monthPrefix = isoDateString(new Date()).slice(0, 7);
  const monthTxns = transactions.filter((t) => t.date.startsWith(monthPrefix));
  const monthIn = monthTxns
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const monthOut = monthTxns
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 1800);
  };

  const handleAddIncome = () => {
    if (parsedIncome <= 0) return;
    onAddIncome(parsedIncome, "Salary", incomeNote.trim() || "Income");
    setIncomeAmount("");
    flashNotice("Income added & split!");
  };

  const applySplitPreset = (split: BucketSplit) => {
    setLocalSplit(split);
    onUpdateSplit(split);
    flashNotice(`Split set to ${split.needs}/${split.spend}/${split.savings}`);
  };

  const handleSaveSplit = () => {
    if (totalSplit !== 100) {
      alert("Must total 100%");
      return;
    }
    onUpdateSplit(localSplit);
    setShowSliders(false);
    flashNotice("Custom split saved!");
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

      {/* 1. Compact Monthly Cashflow Bar */}
      <div className="surface-inset grid grid-cols-2 divide-x divide-zinc-800/70">
        <div className="px-4 py-3">
          <div className="text-[11px] font-medium text-zinc-400">Month In</div>
          <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">
            +{formatINR(monthIn)}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] font-medium text-zinc-400">Month Out</div>
          <div className="text-base font-bold text-zinc-100 tabular-nums mt-0.5">
            -{formatINR(monthOut)}
          </div>
        </div>
      </div>

      {/* 2. Primary Action: Add Income */}
      <section className="surface-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Add Income</h3>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {localSplit.needs}/{localSplit.spend}/{localSplit.savings} split
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {INCOME_PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => setIncomeAmount(String(amt))}
              className={`btn-tap py-1.5 rounded-xl border text-xs font-semibold tabular-nums transition-colors ${
                incomeAmount === String(amt)
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-300"
              }`}
            >
              +{amt / 1000}k
            </button>
          ))}
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
            placeholder="Label"
            className="col-span-3 bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder:text-zinc-600"
          />
        </div>

        <button
          onClick={handleAddIncome}
          disabled={parsedIncome <= 0}
          className="btn-tap w-full py-3 rounded-xl bg-emerald-500 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center justify-center gap-1.5"
        >
          <IndianRupee size={15} strokeWidth={2.5} />
          {parsedIncome > 0 ? `Add ${formatINR(parsedIncome)}` : "Add Income"}
        </button>
      </section>

      {/* 3. Quick Vault Transfer */}
      <section className="surface-inset p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <Lock size={14} className="text-violet-400" />
            Move to Vault
          </span>
          <span className="text-xs text-zinc-400 tabular-nums">
            Spend: {formatINR(spendBalance)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {VAULT_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={spendBalance <= 0}
              onClick={() => {
                const moved = Math.min(amt, Math.max(0, spendBalance));
                if (moved <= 0) return;
                onTransferToVault(moved);
                flashNotice(`Moved ${formatINR(moved)} to Vault!`);
              }}
              className="btn-tap py-2 rounded-xl bg-violet-500/15 disabled:opacity-35 border border-violet-500/30 text-violet-200 text-xs font-semibold tabular-nums"
            >
              +{formatINR(amt)}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Visual Split Ratio & Live Amount Breakdown */}
      <section className="surface-inset p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sliders size={14} className="text-zinc-400" />
            Split Ratio
          </span>
          <button
            onClick={() => setShowSliders(!showSliders)}
            className="btn-tap flex items-center gap-1 text-xs font-medium text-emerald-400"
          >
            <span>{showSliders ? "Done" : "Custom"}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showSliders ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Visual Preset Cards with Mini Ratio Bars */}
        <div className="grid grid-cols-3 gap-2">
          {SPLIT_PRESETS.map((p) => {
            const active =
              localSplit.needs === p.split.needs &&
              localSplit.spend === p.split.spend &&
              localSplit.savings === p.split.savings;
            return (
              <button
                key={p.name}
                onClick={() => applySplitPreset(p.split)}
                className={`btn-tap rounded-2xl p-2.5 text-left border transition-colors ${
                  active
                    ? "bg-zinc-950 border-emerald-500/60"
                    : "bg-zinc-950/60 border-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-semibold ${
                      active ? "text-emerald-300" : "text-zinc-200"
                    }`}
                  >
                    {p.name}
                  </span>
                  {active && <Check size={12} className="text-emerald-400" />}
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden flex gap-0.5 mb-1.5 bg-zinc-800">
                  <div className="h-full bg-blue-500" style={{ width: `${p.split.needs}%` }} />
                  <div className="h-full bg-emerald-500" style={{ width: `${p.split.spend}%` }} />
                  <div className="h-full bg-violet-500" style={{ width: `${p.split.savings}%` }} />
                </div>
                <div className="text-[10px] font-medium text-zinc-400 tabular-nums">
                  {p.split.needs} · {p.split.spend} · {p.split.savings}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Split Amount Preview */}
        {previewBase > 0 && (
          <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                {parsedIncome > 0 ? "New Income Split" : "Current Balance Split"}
              </span>
              <span className="text-zinc-200 font-semibold tabular-nums">
                {formatINR(previewBase)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-900/90 p-2">
                <div className="text-[10px] text-zinc-400">Needs ({localSplit.needs}%)</div>
                <div className="text-xs font-bold text-blue-400 tabular-nums mt-0.5">
                  {formatINR(previewNeeds)}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900/90 p-2">
                <div className="text-[10px] text-zinc-400">Spend ({localSplit.spend}%)</div>
                <div className="text-xs font-bold text-emerald-400 tabular-nums mt-0.5">
                  {formatINR(previewSpend)}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900/90 p-2">
                <div className="text-[10px] text-zinc-400">Vault ({localSplit.savings}%)</div>
                <div className="text-xs font-bold text-violet-400 tabular-nums mt-0.5">
                  {formatINR(previewVault)}
                </div>
              </div>
            </div>

            {parsedIncome === 0 && totalBalance > 0 && totalSplit === 100 && (
              <button
                onClick={() => {
                  onRebalanceBuckets(localSplit);
                  flashNotice("Balance re-split!");
                }}
                className="btn-tap w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
              >
                Re-split Current Balance
              </button>
            )}
          </div>
        )}

        {showSliders && (
          <div className="space-y-3 pt-2 border-t border-zinc-800/70">
            {bucketKeys.map((key) => {
              const { label, hex } = SPLIT_META[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-300">{label}</span>
                    <span className="font-bold text-white tabular-nums">{localSplit[key]}%</span>
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
            <button
              onClick={handleSaveSplit}
              className={`btn-tap w-full py-2.5 rounded-xl text-xs font-bold ${
                totalSplit === 100
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-red-400"
              }`}
            >
              {totalSplit === 100 ? "Save Custom Split" : `Total is ${totalSplit}% (need 100%)`}
            </button>
          </div>
        )}
      </section>

      {/* 5. Reports & Data */}
      <section className="surface-inset divide-y divide-zinc-800/60 overflow-hidden">
        <button
          onClick={() => {
            onExportPDF();
            flashNotice("PDF downloaded!");
          }}
          className="btn-tap w-full flex items-center justify-between px-4 py-3.5 text-sm text-white font-medium"
        >
          <span className="flex items-center gap-2.5">
            <FileText size={16} className="text-emerald-400" />
            Export PDF Statement
          </span>
          <ChevronRight size={15} className="text-zinc-600" />
        </button>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-tap w-full flex items-center justify-between px-4 py-3 text-sm text-red-400"
          >
            <span className="flex items-center gap-2.5">
              <RefreshCw size={15} />
              Reset Data
            </span>
            <ChevronRight size={15} className="text-red-400/50" />
          </button>
        ) : (
          <div className="p-3 flex gap-2 bg-red-500/5">
            <button
              onClick={() => {
                onReset();
                setShowResetConfirm(false);
                flashNotice("Data reset to 0");
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
    </div>
  );
}
