"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";
import { useWalletStore } from "@/hooks/useWalletStore";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { AutoDeductToast } from "@/components/ui/AutoDeductToast";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { HomeTab } from "@/components/home/HomeTab";
import { AutoRulesTab } from "@/components/autorules/AutoRulesTab";
import { ForecastTab } from "@/components/forecast/ForecastTab";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { formatINR } from "@/utils/currency";

type Tab = "home" | "rules" | "forecast" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  home: "Chandru's Wallet",
  rules: "Auto-Deduct",
  forecast: "Forecast",
  settings: "Manage",
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);
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
    rebalanceBuckets,
    updateSelfTaxRule,
    exportPDF,
    transferToVault,
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
  const totalSpent = state.transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const netWorthDisplay = `${totalBalance < 0 ? "-" : ""}${formatINR(totalBalance)}`;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-md mx-auto">
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
      <AutoDeductToast
        summaries={showSplash ? [] : autoDeductSummaries}
        onDismiss={dismissAutoDeductSummaries}
      />

      {/* Stylish Chandru Wallet Header */}
      <header className="pt-safe sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Wallet size={16} className="text-zinc-950" strokeWidth={2.4} />
            </div>
            {activeTab === "home" ? (
              <h1 className="text-base font-extrabold tracking-tight truncate">
                <span className="text-white">Chandru&apos;s </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Wallet
                </span>
              </h1>
            ) : (
              <h1 className="text-base font-bold tracking-tight text-white truncate">
                {TAB_LABELS[activeTab]}
              </h1>
            )}
          </div>

          {/* Spent & Remaining Pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
            <div className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
              <span className="text-zinc-500">Spent </span>
              <span className="text-rose-400 font-bold">{formatINR(totalSpent)}</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px]">
              <span className="text-emerald-400/80">Left </span>
              <span
                className={`font-bold ${
                  totalBalance >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {netWorthDisplay}
              </span>
            </div>
          </div>
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
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              monthlyIncome={state.monthlyIncome}
              bucketSplit={state.bucketSplit}
              spendBalance={state.buckets.spend}
              totalBalance={totalBalance}
              transactions={state.transactions}
              onAddIncome={addIncome}
              onUpdateSplit={updateBucketSplit}
              onRebalanceBuckets={rebalanceBuckets}
              onTransferToVault={transferToVault}
              onExportPDF={exportPDF}
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
