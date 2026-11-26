"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Shield, X, Calendar, Clock, Sparkles } from "lucide-react";
import { AutoRule, SelfTaxRule, BucketKey } from "@/types";
import { formatINR } from "@/utils/currency";

interface AutoRulesTabProps {
  autoRules: AutoRule[];
  selfTaxRule: SelfTaxRule;
  onAddRule: (rule: Omit<AutoRule, "id">) => void;
  onUpdateRule: (id: string, updates: Partial<AutoRule>) => void;
  onDeleteRule: (id: string) => void;
  onUpdateSelfTax: (rule: SelfTaxRule) => void;
}

const PENALTY_PRESETS = [50, 100, 150, 250];
const SHORT_BUCKET: Record<BucketKey, { label: string; color: string }> = {
  needs: { label: "Needs", color: "text-blue-400" },
  spend: { label: "Spend", color: "text-emerald-400" },
  savings: { label: "Vault", color: "text-violet-400" },
};

const QUICK_STARTERS: Omit<AutoRule, "id">[] = [
  { name: "Rent", amount: 8000, frequency: "monthly", dayOfMonth: 1, bucket: "needs", enabled: true },
  { name: "Wi-Fi", amount: 799, frequency: "monthly", dayOfMonth: 5, bucket: "needs", enabled: true },
  { name: "Travel", amount: 100, frequency: "daily", bucket: "spend", enabled: true },
];

export function AutoRulesTab({
  autoRules,
  selfTaxRule,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onUpdateSelfTax,
}: AutoRulesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFreq, setNewFreq] = useState<"monthly" | "daily">("monthly");
  const [newDay, setNewDay] = useState("1");
  const [newBucket, setNewBucket] = useState<BucketKey>("needs");

  const handleAdd = () => {
    const amt = parseFloat(newAmount);
    if (!newName.trim() || isNaN(amt) || amt <= 0) return;
    onAddRule({
      name: newName.trim(),
      amount: amt,
      frequency: newFreq,
      dayOfMonth:
        newFreq === "monthly"
          ? Math.min(31, Math.max(1, parseInt(newDay) || 1))
          : undefined,
      bucket: newBucket,
      enabled: true,
    });
    setNewName("");
    setNewAmount("");
    setShowAddModal(false);
  };

  const monthlyTotal = autoRules
    .filter((r) => r.frequency === "monthly" && r.enabled)
    .reduce((s, r) => s + r.amount, 0);
  const dailyTotal = autoRules
    .filter((r) => r.frequency === "daily" && r.enabled)
    .reduce((s, r) => s + r.amount, 0);
  const committedMonthly = monthlyTotal + dailyTotal * 30;
  const activeCount = autoRules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-4">
      {/* 1. Hero Monthly Burn Card */}
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">
                Monthly Burn
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 tabular-nums">
                {activeCount} active
              </span>
            </div>
            <div className="text-3xl font-bold text-white tabular-nums mt-1.5">
              {formatINR(committedMonthly)}
              <span className="text-xs font-normal text-zinc-500"> / mo</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-tap flex items-center gap-1.5 bg-emerald-500 text-zinc-950 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/15"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Rule
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-2 divide-x divide-zinc-800/80 text-xs">
          <div className="pr-3 flex items-center justify-between">
            <span className="text-zinc-500">Monthly</span>
            <span className="text-blue-400 font-semibold tabular-nums">
              {formatINR(monthlyTotal)}
            </span>
          </div>
          <div className="pl-3 flex items-center justify-between">
            <span className="text-zinc-500">Daily</span>
            <span className="text-amber-400 font-semibold tabular-nums">
              {formatINR(dailyTotal)}/d
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scheduled Rules (with 1-tap Starters when empty) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-zinc-400">
            Scheduled Rules
          </span>
          {autoRules.length > 0 && (
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {autoRules.length} total
            </span>
          )}
        </div>

        {autoRules.length === 0 ? (
          <div className="surface-inset p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Sparkles size={13} className="text-emerald-400" />
              <span>Quick-add a common rule</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter.name}
                  onClick={() => onAddRule(starter)}
                  className="btn-tap rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-2.5 text-left"
                >
                  <div className="text-xs font-semibold text-white">
                    +{starter.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 tabular-nums mt-0.5">
                    {formatINR(starter.amount)}
                    {starter.frequency === "daily" ? "/d" : "/mo"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface-inset divide-y divide-zinc-800/60 overflow-hidden">
            {autoRules.map((rule) => {
              const isMonthly = rule.frequency === "monthly";
              const bucketInfo = SHORT_BUCKET[rule.bucket];

              return (
                <div
                  key={rule.id}
                  className={`px-3.5 py-3 flex items-center gap-3 transition-opacity ${
                    rule.enabled ? "opacity-100" : "opacity-45"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isMonthly
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {isMonthly ? <Calendar size={16} /> : <Clock size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {rule.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 tabular-nums mt-0.5 flex items-center gap-1.5">
                      <span className="text-zinc-200 font-semibold">
                        {formatINR(rule.amount)}
                      </span>
                      <span>·</span>
                      <span>
                        {isMonthly ? `Day ${rule.dayOfMonth}` : "Daily"}
                      </span>
                      <span>·</span>
                      <span className={bucketInfo.color}>{bucketInfo.label}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateRule(rule.id, { enabled: !rule.enabled })
                    }
                    className={`btn-tap rounded-full transition-colors relative flex-shrink-0 ${
                      rule.enabled ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                    style={{ width: 40, height: 22 }}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    aria-label="Delete rule"
                    className="btn-tap w-8 h-8 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center flex-shrink-0"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Self-Tax Segmented Card */}
      <div className="surface-inset p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Self-Tax</div>
              <div className="text-[11px] text-zinc-400">
                Save +{formatINR(selfTaxRule.penaltyAmount)} on{" "}
                {selfTaxRule.triggerCategory === "Food Delivery / Junk"
                  ? "Junk Food"
                  : selfTaxRule.triggerCategory}
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              onUpdateSelfTax({ ...selfTaxRule, enabled: !selfTaxRule.enabled })
            }
            className={`btn-tap w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              selfTaxRule.enabled ? "bg-violet-500" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                selfTaxRule.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {selfTaxRule.enabled && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/70">
            {/* Segmented Penalty Track */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/70">
              {PENALTY_PRESETS.map((amt) => (
                <button
                  key={amt}
                  onClick={() =>
                    onUpdateSelfTax({ ...selfTaxRule, penaltyAmount: amt })
                  }
                  className={`btn-tap py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                    selfTaxRule.penaltyAmount === amt
                      ? "bg-violet-500 text-white shadow"
                      : "text-zinc-400"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Segmented Category Track */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/70">
              {["Food Delivery / Junk", "Entertainment", "Shopping"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      onUpdateSelfTax({ ...selfTaxRule, triggerCategory: cat })
                    }
                    className={`btn-tap py-1.5 px-2 rounded-lg text-[11px] font-semibold truncate transition-colors ${
                      selfTaxRule.triggerCategory === cat
                        ? "bg-zinc-800 text-violet-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {cat === "Food Delivery / Junk" ? "Junk Food" : cat}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl pb-safe max-w-md mx-auto"
            >
              <div className="p-5 space-y-3.5">
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-1" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">New Rule</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-tap w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                  >
                    <X size={16} className="text-zinc-400" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name (e.g. Rent, Wi-Fi)"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-600"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="₹ Amount"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-600 tabular-nums"
                />

                <div className="grid grid-cols-2 gap-2">
                  {(["monthly", "daily"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setNewFreq(f)}
                      className={`btn-tap py-2.5 rounded-xl text-xs font-semibold border capitalize ${
                        newFreq === f
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {newFreq === "monthly" && (
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5">
                    <span className="text-xs text-zinc-400">Day of month</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 text-white text-sm text-center rounded-lg py-1 outline-none tabular-nums"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {(["needs", "spend", "savings"] as BucketKey[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => setNewBucket(id)}
                      className={`btn-tap py-2.5 rounded-xl text-xs font-semibold border ${
                        newBucket === id
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {SHORT_BUCKET[id].label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || !(parseFloat(newAmount) > 0)}
                  className="btn-tap w-full py-3.5 rounded-2xl bg-emerald-500 disabled:opacity-40 text-zinc-950 font-bold text-sm"
                >
                  Save Rule
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
