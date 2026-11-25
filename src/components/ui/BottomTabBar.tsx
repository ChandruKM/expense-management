"use client";

import { motion } from "framer-motion";
import { Wallet, Repeat, TrendingUp, SlidersHorizontal } from "lucide-react";

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Today", Icon: Wallet },
  { id: "rules", label: "Auto", Icon: Repeat },
  { id: "forecast", label: "Timeline", Icon: TrendingUp },
  { id: "settings", label: "Manage", Icon: SlidersHorizontal },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/70">
      <div className="max-w-md mx-auto flex items-center pb-safe px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="btn-tap flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
            >
              <div className="relative flex items-center justify-center w-12 h-7">
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/25 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={isActive ? "text-emerald-400 relative z-10" : "text-zinc-500 relative z-10"}
                />
              </div>
              <span
                className={`text-[10px] tracking-wide font-semibold ${
                  isActive ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
