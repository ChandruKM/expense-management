"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WalletState,
  Transaction,
  AutoRule,
  Buckets,
  BucketSplit,
  SelfTaxRule,
  BucketKey,
} from "@/types";
import { isoDateString, getDaysBetween, parseISODate } from "@/utils/currency";

const STORAGE_KEY = "flowwallet_v1";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_STATE: WalletState = {
  buckets: {
    needs: 20000,
    spend: 12000,
    savings: 8000,
  },
  bucketSplit: {
    needs: 50,
    spend: 30,
    savings: 20,
  },
  transactions: [
    {
      id: generateId(),
      date: isoDateString(new Date(Date.now() - 86400000 * 2)),
      type: "income",
      category: "Salary",
      note: "Monthly Salary",
      amount: 40000,
      bucket: "needs",
      isAuto: false,
    },
    {
      id: generateId(),
      date: isoDateString(new Date(Date.now() - 86400000 * 1)),
      type: "expense",
      category: "Food",
      note: "Lunch",
      amount: -120,
      bucket: "spend",
      isAuto: false,
    },
    {
      id: generateId(),
      date: isoDateString(new Date(Date.now() - 86400000 * 1)),
      type: "expense",
      category: "Transport",
      note: "Petrol",
      amount: -200,
      bucket: "spend",
      isAuto: false,
    },
    {
      id: generateId(),
      date: isoDateString(new Date()),
      type: "expense",
      category: "Tea/Coffee",
      note: "Morning Tea",
      amount: -20,
      bucket: "spend",
      isAuto: false,
    },
  ],
  autoRules: [
    {
      id: generateId(),
      name: "Rent",
      amount: 8000,
      frequency: "monthly",
      dayOfMonth: 1,
      bucket: "needs",
      enabled: true,
    },
    {
      id: generateId(),
      name: "Wi-Fi",
      amount: 799,
      frequency: "monthly",
      dayOfMonth: 5,
      bucket: "needs",
      enabled: true,
    },
    {
      id: generateId(),
      name: "Daily Travel",
      amount: 100,
      frequency: "daily",
      bucket: "spend",
      enabled: true,
    },
  ],
  selfTaxRule: {
    enabled: true,
    triggerCategory: "Food Delivery / Junk",
    penaltyAmount: 100,
    targetBucket: "savings",
  },
  monthlyIncome: 40000,
  hourlyRate: 250,
  currency: "INR",
  lastCheckedDate: isoDateString(new Date()),
  lifeHoursMode: false,
};

function loadState(): WalletState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    // Merge to pick up any new default fields
    return { ...DEFAULT_STATE, ...parsed, lifeHoursMode: false };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: WalletState): void {
  if (typeof window === "undefined") return;
  try {
    const { lifeHoursMode: _, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // quota exceeded
  }
}

export interface AutoDeductSummary {
  ruleId: string;
  ruleName: string;
  amount: number;
  days: number;
  total: number;
  bucket: BucketKey;
}

export function useWalletStore() {
  const [state, setStateRaw] = useState<WalletState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [autoDeductSummaries, setAutoDeductSummaries] = useState<AutoDeductSummary[]>([]);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const loaded = loadState();
    setStateRaw(loaded);
    setLoaded(true);
  }, []);

  const setState = useCallback((updater: (prev: WalletState) => WalletState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Process auto-deductions on load
  useEffect(() => {
    if (!loaded) return;
    const today = isoDateString(new Date());
    if (state.lastCheckedDate === today) return;

    const missedDates = getDaysBetween(state.lastCheckedDate, today);
    if (missedDates.length === 0) return;

    const summaryMap: Record<string, AutoDeductSummary> = {};
    const newTransactions: Transaction[] = [];
    const newBuckets: Buckets = { ...state.buckets };

    for (const dateStr of missedDates) {
      const date = parseISODate(dateStr);
      const dayOfMonth = date.getDate();

      for (const rule of state.autoRules) {
        if (!rule.enabled) continue;

        let shouldDeduct = false;
        if (rule.frequency === "daily") {
          shouldDeduct = true;
        } else if (rule.frequency === "monthly" && rule.dayOfMonth === dayOfMonth) {
          shouldDeduct = true;
        }

        if (shouldDeduct) {
          newTransactions.push({
            id: generateId(),
            date: dateStr,
            type: "auto",
            category: rule.name,
            note: `Auto-deduct: ${rule.name}`,
            amount: -rule.amount,
            bucket: rule.bucket,
            isAuto: true,
            ruleId: rule.id,
          });
          newBuckets[rule.bucket] = newBuckets[rule.bucket] - rule.amount;

          if (!summaryMap[rule.id]) {
            summaryMap[rule.id] = {
              ruleId: rule.id,
              ruleName: rule.name,
              amount: rule.amount,
              days: 0,
              total: 0,
              bucket: rule.bucket,
            };
          }
          summaryMap[rule.id].days += 1;
          summaryMap[rule.id].total += rule.amount;
        }
      }
    }

    if (newTransactions.length > 0) {
      setState((prev) => ({
        ...prev,
        buckets: newBuckets,
        transactions: [...prev.transactions, ...newTransactions],
        lastCheckedDate: today,
      }));
      setAutoDeductSummaries(Object.values(summaryMap));
    } else {
      setState((prev) => ({ ...prev, lastCheckedDate: today }));
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- ACTIONS ---

  const addIncome = useCallback(
    (amount: number, category: string, note: string) => {
      setState((prev) => {
        const split = prev.bucketSplit;
        const needsAmt = Math.round((amount * split.needs) / 100);
        const spendAmt = Math.round((amount * split.spend) / 100);
        const savingsAmt = amount - needsAmt - spendAmt;

        const baseId = generateId();
        const today = isoDateString(new Date());

        const newTxns: Transaction[] = [
          {
            id: `${baseId}_n`,
            date: today,
            type: "income",
            category,
            note: `${note} → Fixed Bills`,
            amount: needsAmt,
            bucket: "needs",
          },
          {
            id: `${baseId}_s`,
            date: today,
            type: "income",
            category,
            note: `${note} → Safe-to-Spend`,
            amount: spendAmt,
            bucket: "spend",
          },
          {
            id: `${baseId}_v`,
            date: today,
            type: "income",
            category,
            note: `${note} → Savings Vault`,
            amount: savingsAmt,
            bucket: "savings",
          },
        ];

        return {
          ...prev,
          buckets: {
            needs: prev.buckets.needs + needsAmt,
            spend: prev.buckets.spend + spendAmt,
            savings: prev.buckets.savings + savingsAmt,
          },
          transactions: [...prev.transactions, ...newTxns],
          monthlyIncome: amount,
          hourlyRate: Math.round(amount / 160),
        };
      });
    },
    [setState]
  );

  const addExpense = useCallback(
    (amount: number, category: string, note: string, bucket: BucketKey = "spend") => {
      setState((prev) => {
        const today = isoDateString(new Date());
        const newTxns: Transaction[] = [
          {
            id: generateId(),
            date: today,
            type: "expense",
            category,
            note,
            amount: -amount,
            bucket,
          },
        ];
        const newBuckets = { ...prev.buckets, [bucket]: prev.buckets[bucket] - amount };

        // Self-tax check
        const selfTax = prev.selfTaxRule;
        if (selfTax.enabled && category === selfTax.triggerCategory) {
          newTxns.push({
            id: generateId(),
            date: today,
            type: "self-tax",
            category: "Self-Tax Penalty",
            note: `Self-tax for ${category}`,
            amount: -selfTax.penaltyAmount,
            bucket: selfTax.targetBucket,
          });
          // Move penalty from spend to savings
          newBuckets[bucket] = newBuckets[bucket] - selfTax.penaltyAmount;
          newBuckets[selfTax.targetBucket] = newBuckets[selfTax.targetBucket] + selfTax.penaltyAmount;
        }

        return {
          ...prev,
          buckets: newBuckets,
          transactions: [...prev.transactions, ...newTxns],
        };
      });
    },
    [setState]
  );

  const addAutoRule = useCallback(
    (rule: Omit<AutoRule, "id">) => {
      setState((prev) => ({
        ...prev,
        autoRules: [...prev.autoRules, { ...rule, id: generateId() }],
      }));
    },
    [setState]
  );

  const updateAutoRule = useCallback(
    (id: string, updates: Partial<AutoRule>) => {
      setState((prev) => ({
        ...prev,
        autoRules: prev.autoRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    },
    [setState]
  );

  const deleteAutoRule = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        autoRules: prev.autoRules.filter((r) => r.id !== id),
      }));
    },
    [setState]
  );

  const updateBucketSplit = useCallback(
    (split: BucketSplit) => {
      setState((prev) => ({ ...prev, bucketSplit: split }));
    },
    [setState]
  );

  const updateSelfTaxRule = useCallback(
    (rule: SelfTaxRule) => {
      setState((prev) => ({ ...prev, selfTaxRule: rule }));
    },
    [setState]
  );

  const updateHourlyRate = useCallback(
    (rate: number) => {
      setState((prev) => ({ ...prev, hourlyRate: rate }));
    },
    [setState]
  );

  const toggleLifeHoursMode = useCallback(() => {
    setStateRaw((prev) => ({ ...prev, lifeHoursMode: !prev.lifeHoursMode }));
  }, []);

  const exportBackup = useCallback(() => {
    const { lifeHoursMode: _, ...toExport } = state;
    const json = JSON.stringify(toExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowwallet-backup-${isoDateString(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importBackup = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json);
        setState(() => ({ ...DEFAULT_STATE, ...parsed, lifeHoursMode: false }));
      } catch {
        alert("Invalid backup file");
      }
    },
    [setState]
  );

  const resetToDefaults = useCallback(() => {
    setState(() => DEFAULT_STATE);
  }, [setState]);

  const dismissAutoDeductSummaries = useCallback(() => {
    setAutoDeductSummaries([]);
  }, []);

  return {
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
  };
}
