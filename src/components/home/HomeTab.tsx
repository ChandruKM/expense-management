"use client";

import { useState, useCallback } from "react";
import { LiquidTank } from "@/components/home/LiquidTank";
import { BucketCards } from "@/components/home/BucketCards";
import { QuickChips } from "@/components/home/QuickChips";
import { VoiceDeductButton } from "@/components/home/VoiceDeductButton";
import { AddExpenseModal } from "@/components/home/AddExpenseModal";
import { TransactionList } from "@/components/home/TransactionList";
import { WalletState, BucketKey } from "@/types";

interface HomeTabProps {
  state: WalletState;
  onAddExpense: (
    amount: number,
    category: string,
    note: string,
    bucket?: BucketKey
  ) => void;
}

export function HomeTab({ state, onAddExpense }: HomeTabProps) {
  const [showSelfTaxCelebration, setShowSelfTaxCelebration] = useState(false);

  const handleDeduct = useCallback(
    (amount: number, category: string, note: string) => {
      onAddExpense(amount, category, note);
      if (state.selfTaxRule.enabled && category === state.selfTaxRule.triggerCategory) {
        setShowSelfTaxCelebration(true);
        setTimeout(() => setShowSelfTaxCelebration(false), 2500);
      }
    },
    [onAddExpense, state.selfTaxRule]
  );

  const totalSpendIn = state.transactions
    .filter((t) => t.bucket === "spend" && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const initialSpendBucket = Math.max(totalSpendIn, state.buckets.spend);

  return (
    <div className="space-y-4">
      {/* Hero Safe-to-Spend Card */}
      <LiquidTank
        spendBucket={state.buckets.spend}
        initialSpendBucket={initialSpendBucket}
        lifeHoursMode={state.lifeHoursMode}
        hourlyRate={state.hourlyRate}
      />

      {/* Primary Action Dock: Deduct + Voice */}
      <div className="flex items-center gap-2.5">
        <AddExpenseModal onAdd={onAddExpense} />
        <VoiceDeductButton onDeduct={handleDeduct} />
      </div>

      {/* 3-Bucket Allocation Strip */}
      <BucketCards
        buckets={state.buckets}
        lifeHoursMode={state.lifeHoursMode}
        hourlyRate={state.hourlyRate}
      />

      {/* 1-Tap Quick Deduct Carousel */}
      <QuickChips
        onDeduct={handleDeduct}
        lifeHoursMode={state.lifeHoursMode}
        hourlyRate={state.hourlyRate}
        selfTaxCategory={state.selfTaxRule.triggerCategory}
        selfTaxEnabled={state.selfTaxRule.enabled}
        selfTaxAmount={state.selfTaxRule.penaltyAmount}
        showSelfTaxCelebration={showSelfTaxCelebration}
      />

      {/* Date-grouped Activity Feed */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Recent Activity
          </span>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {state.transactions.length} entries
          </span>
        </div>
        <TransactionList
          transactions={state.transactions}
          lifeHoursMode={state.lifeHoursMode}
          hourlyRate={state.hourlyRate}
          limit={15}
        />
      </div>
    </div>
  );
}
