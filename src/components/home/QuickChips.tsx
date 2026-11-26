"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coffee, Utensils, Fuel, ShoppingBag, Bike, Navigation } from "lucide-react";
import { QuickChip, DEFAULT_QUICK_CHIPS } from "@/types";
import { formatINR } from "@/utils/currency";

interface QuickChipsProps {
  onDeduct: (amount: number, category: string, label: string) => void;
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
  selfTaxCategory,
  selfTaxEnabled,
  showSelfTaxCelebration,
}: QuickChipsProps) {
  const chips: QuickChip[] = DEFAULT_QUICK_CHIPS;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {showSelfTaxCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/15 border border-violet-500/30 px-3 py-1.5 rounded-xl font-medium w-fit"
          >
            <Sparkles size={13} />
            <span>Self-tax added to Vault!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean 3x2 grid — zero horizontal clipping */}
      <div className="grid grid-cols-3 gap-2">
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
              className={`btn-tap flex items-center justify-between px-3 py-2.5 rounded-2xl border text-xs transition-colors ${
                isSelfTax
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-200"
                  : "bg-zinc-900/90 border-zinc-800/80 text-zinc-200 active:bg-zinc-800"
              }`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Icon
                  size={13}
                  className={isSelfTax ? "text-violet-400 flex-shrink-0" : "text-emerald-400 flex-shrink-0"}
                />
                <span className="font-medium truncate">{cleanName}</span>
              </span>
              <span className="text-zinc-400 tabular-nums font-semibold ml-1 flex-shrink-0">
                {formatINR(chip.amount)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
