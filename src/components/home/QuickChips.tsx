"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coffee, Utensils, Fuel, ShoppingBag, Bike, Navigation } from "lucide-react";
import { QuickChip, DEFAULT_QUICK_CHIPS } from "@/types";
import { formatINR, toLifeHours } from "@/utils/currency";

interface QuickChipsProps {
  onDeduct: (amount: number, category: string, label: string) => void;
  lifeHoursMode: boolean;
  hourlyRate: number;
  selfTaxCategory: string;
  selfTaxEnabled: boolean;
  selfTaxAmount: number;
  showSelfTaxCelebration: boolean;
}

const CHIP_ICONS: Record<string, typeof Coffee> = {
  "Tea/Coffee": Coffee,
  Food: Utensils,
  Transport: Fuel,
  Groceries: ShoppingBag,
  "Food Delivery / Junk": Bike,
};

export function QuickChips({
  onDeduct,
  lifeHoursMode,
  hourlyRate,
  selfTaxCategory,
  selfTaxEnabled,
  showSelfTaxCelebration,
}: QuickChipsProps) {
  const chips: QuickChip[] = DEFAULT_QUICK_CHIPS;

  const formatAmount = (amount: number) =>
    lifeHoursMode ? toLifeHours(amount, hourlyRate).replace(" of work", "") : formatINR(amount);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          1-Tap Deduct
        </span>
        <AnimatePresence>
          {showSelfTaxCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-[11px] text-violet-300 bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium"
            >
              <Sparkles size={11} />
              <span>Self-tax vaulted!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {chips.map((chip) => {
          const isSelfTax = selfTaxEnabled && chip.category === selfTaxCategory;
          const cleanName = chip.label.split(" ")[0];
          const Icon =
            cleanName === "Rickshaw"
              ? Navigation
              : CHIP_ICONS[chip.category] || Utensils;

          return (
            <button
              key={chip.label}
              onClick={() => onDeduct(chip.amount, chip.category, cleanName)}
              className={`btn-tap flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-medium transition-colors ${
                isSelfTax
                  ? "bg-violet-500/15 border-violet-500/35 text-violet-200"
                  : "bg-zinc-900 border-zinc-800 text-zinc-200 active:bg-zinc-800"
              }`}
            >
              <Icon
                size={14}
                className={isSelfTax ? "text-violet-400" : "text-emerald-400"}
              />
              <span>{cleanName}</span>
              <span className="text-zinc-400 tabular-nums font-semibold">
                {formatAmount(chip.amount)}
              </span>
              {isSelfTax && (
                <span className="text-[9px] font-bold uppercase bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-md">
                  +tax
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
