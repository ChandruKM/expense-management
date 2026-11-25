"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, IndianRupee } from "lucide-react";
import { useWalletStore } from "@/hooks/useWalletStore";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { AutoDeductToast } from "@/components/ui/AutoDeductToast";
import { HomeTab } from "@/components/home/HomeTab";
import { AutoRulesTab } from "@/components/autorules/AutoRulesTab";
import { ForecastTab } from "@/components/forecast/ForecastTab";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { formatINR, toLifeHours } from "@/utils/currency";

type Tab = "home" | "rules" | "forecast" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  home: "FlowWallet",
  rules: "Auto-Rules",
  forecast: "Timeline",
  settings: "Manage",
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const {
    state,
    loaded,
    autoDeductSummaries,
    dismissAutoDeductSummaries,
    addIncome,
    addExpense,
    addAutoRule,
    updateAutoRule,
    deleteAutoRule,
    updateBucketSplit,
    updateSelfTaxRule,
    updateHourlyRate,
    toggleLifeHoursMode,
    exportBackup,
    importBackup,
    resetToDefaults,
  } = useWalletStore();

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalBalance = Object.values(state.buckets).reduce((s, v) => s + v, 0);
  const netWorthDisplay = state.lifeHoursMode
    ? toLifeHours(totalBalance, state.hourlyRate).replace(" of work", "")
    : `${totalBalance < 0 ? "-" : ""}${formatINR(totalBalance)}`;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-md mx-auto">
      <AutoDeductToast
        summaries={autoDeductSummaries}
        onDismiss={dismissAutoDeductSummaries}
      />

      {/* iOS Translucent Top Bar */}
      <header className="pt-safe sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              {TAB_LABELS[activeTab]}
            </h1>
            <p className="text-[11px] text-zinc-500 tabular-nums">
              Net{" "}
              <span className={totalBalance >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                {netWorthDisplay}
              </span>
            </p>
          </div>

          {/* Segmented INR <-> Life Hours Pill */}
          <button
            onClick={toggleLifeHoursMode}
            className="btn-tap relative flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-0.5 text-[11px] font-semibold"
          >
            <span
              className={`relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
                !state.lifeHoursMode ? "text-zinc-950" : "text-zinc-400"
              }`}
            >
              {!state.lifeHoursMode && (
                <motion.span
                  layoutId="unit-pill"
                  className="absolute inset-0 bg-emerald-400 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <IndianRupee size={11} />
              INR
            </span>
            <span
              className={`relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
                state.lifeHoursMode ? "text-zinc-950" : "text-zinc-400"
              }`}
            >
              {state.lifeHoursMode && (
                <motion.span
                  layoutId="unit-pill"
                  className="absolute inset-0 bg-amber-400 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Clock size={11} />
              Life
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-ios px-4 py-4 pb-24">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
        >
          {activeTab === "home" && (
            <HomeTab state={state} onAddExpense={addExpense} />
          )}
          {activeTab === "rules" && (
            <AutoRulesTab
              autoRules={state.autoRules}
              selfTaxRule={state.selfTaxRule}
              onAddRule={addAutoRule}
              onUpdateRule={updateAutoRule}
              onDeleteRule={deleteAutoRule}
              onUpdateSelfTax={updateSelfTaxRule}
            />
          )}
          {activeTab === "forecast" && (
            <ForecastTab
              buckets={state.buckets}
              autoRules={state.autoRules}
              monthlyIncome={state.monthlyIncome}
              lifeHoursMode={state.lifeHoursMode}
              hourlyRate={state.hourlyRate}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              monthlyIncome={state.monthlyIncome}
              hourlyRate={state.hourlyRate}
              bucketSplit={state.bucketSplit}
              onAddIncome={addIncome}
              onUpdateSplit={updateBucketSplit}
              onUpdateHourlyRate={updateHourlyRate}
              onExport={exportBackup}
              onImport={importBackup}
              onReset={resetToDefaults}
            />
          )}
        </motion.div>
      </main>

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />
    </div>
  );
}
