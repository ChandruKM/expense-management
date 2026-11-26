"use client";

import { useCallback } from "react";
import { LiquidTank } from "@/components/home/LiquidTank";
import { BucketCards } from "@/components/home/BucketCards";
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
  const handleDeduct = useCallback(
    (amount: number, category: string, note: string) => {
      onAddExpense(amount, category, note);
    },
    [onAddExpense]
  );

  const totalSpendOut = state.transactions
    .filter((t) => t.bucket === "spend" && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const initialSpendBucket = Math.max(state.buckets.spend + totalSpendOut, state.buckets.spend);

  return (
    <div className="space-y-4">
      <LiquidTank
        spendBucket={state.buckets.spend}
        initialSpendBucket={initialSpendBucket}
        totalSpent={totalSpendOut}
      />

      <div className="flex items-center gap-2.5">
        <AddExpenseModal onAdd={onAddExpense} />
        <VoiceDeductButton onDeduct={handleDeduct} />
      </div>

      <BucketCards buckets={state.buckets} />

      <TransactionList
        transactions={state.transactions}
      />
    </div>
  );
}
