"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, Clock, Shield, X, ArrowRight } from "lucide-react";
import { AutoRule, SelfTaxRule, BucketKey, BUCKET_LABELS } from "@/types";
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
      dayOfMonth: newFreq === "monthly" ? Math.min(31, Math.max(1, parseInt(newDay) || 1)) : undefined,
      bucket: newBucket,
      enabled: true,
    });
    setNewName("");
    setNewAmount("");
    setShowAddModal(false);
  };

  const monthlyRules = autoRules.filter((r) => r.frequency === "monthly");
  const dailyRules = autoRules.filter((r) => r.frequency === "daily");
  const monthlyTotal = monthlyRules.reduce((s, r) => s + (r.enabled ? r.amount : 0), 0);
  const dailyTotal = dailyRules.reduce((s, r) => s + (r.enabled ? r.amount : 0), 0);
  const committedMonthly = monthlyTotal + dailyTotal * 30;

  return (
    <div className="space-y-4">
      {/* Committed Burn Banner */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Monthly Committed Auto-Burn
            </div>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              {formatINR(committedMonthly)}
              <span className="text-xs font-normal text-zinc-500"> / mo</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-tap flex items-center gap-1.5 bg-emerald-500 text-zinc-950 px-3.5 py-2 rounded-xl text-xs font-bold"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Rule
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="text-zinc-400">
            Fixed Monthly:{" "}
            <span className="text-blue-400 font-semibold tabular-nums">
              {formatINR(monthlyTotal)}
            </span>
          </div>
          <div className="text-zinc-400 text-right">
            Daily Habits:{" "}
            <span className="text-amber-400 font-semibold tabular-nums">
              {formatINR(dailyTotal)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Self-Tax Vault Card */}
      <div className="surface-inset p-4 border-violet-500/25">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <Shield size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Self-Tax Rule</div>
              <div className="text-[11px] text-zinc-400">Guilt-free penalty into Vault</div>
            </div>
          </div>
          <button
            onClick={() => onUpdateSelfTax({ ...selfTaxRule, enabled: !selfTaxRule.enabled })}
            className={`btn-tap w-11 h-6 rounded-full transition-colors relative ${
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
          <div className="mt-3.5 space-y-3 pt-3 border-t border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs bg-zinc-950/70 rounded-xl p-2.5 text-zinc-300">
              <span className="text-violet-300 font-medium truncate">
                {selfTaxRule.triggerCategory}
              </span>
              <ArrowRight size={12} className="text-zinc-500 flex-shrink-0" />
              <span className="text-emerald-400 font-semibold flex-shrink-0">
                +{formatINR(selfTaxRule.penaltyAmount)} to Vault
              </span>
            </div>

            <div className="flex gap-1.5">
              {PENALTY_PRESETS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => onUpdateSelfTax({ ...selfTaxRule, penaltyAmount: amt })}
                  className={`btn-tap flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selfTaxRule.penaltyAmount === amt
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              {["Food Delivery / Junk", "Entertainment", "Shopping"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onUpdateSelfTax({ ...selfTaxRule, triggerCategory: cat })}
                  className={`btn-tap flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border truncate transition-colors ${
                    selfTaxRule.triggerCategory === cat
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  {cat === "Food Delivery / Junk" ? "Junk Food" : cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grouped Rules Lists */}
      {autoRules.length === 0 ? (
        <div className="surface-inset text-center py-8 text-zinc-500 text-sm">
          No auto-deduct rules yet · Tap New Rule above
        </div>
      ) : (
        (["monthly", "daily"] as const).map((freq) => {
          const rules = autoRules.filter((r) => r.frequency === freq);
          if (rules.length === 0) return null;
          return (
            <div key={freq} className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 px-1 flex items-center gap-1.5">
                {freq === "monthly" ? <Calendar size={11} /> : <Clock size={11} />}
                {freq === "monthly" ? "Monthly Scheduled" : "Daily Habits"}
              </div>
              <div className="surface-inset divide-y divide-zinc-800/70 overflow-hidden">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`px-3.5 py-3 flex items-center gap-3 transition-opacity ${
                      rule.enabled ? "opacity-100" : "opacity-45"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {rule.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            rule.frequency === "monthly"
                              ? "bg-blue-500/15 text-blue-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {rule.frequency === "monthly" ? `Day ${rule.dayOfMonth}` : "Daily"}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                        {formatINR(rule.amount)} · {BUCKET_LABELS[rule.bucket]}
                      </div>
                    </div>

                    <button
                      onClick={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
                      className={`btn-tap w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${
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
                ))}
              </div>
            </div>
          );
        })
      )}

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
              <div className="p-5 space-y-4">
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-1" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">New Auto-Deduct Rule</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-tap w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                  >
                    <X size={16} className="text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Rule name (e.g. Rent, Wi-Fi, Chai)"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-600"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Amount in ₹"
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
                      <span className="text-xs text-zinc-400">Deduct on day of month</span>
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
                    {(
                      [
                        { id: "needs", label: "Needs" },
                        { id: "spend", label: "Spend" },
                        { id: "savings", label: "Vault" },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setNewBucket(id)}
                        className={`btn-tap py-2.5 rounded-xl text-xs font-semibold border ${
                          newBucket === id
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  className="btn-tap w-full py-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-sm"
                >
                  Create Rule
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
