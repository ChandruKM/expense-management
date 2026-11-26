"use client";

import { motion } from "framer-motion";
import { Wallet, Sparkles } from "lucide-react";

const PILLS = ["Auto-Split", "Auto-Deduct", "60d Forecast"];

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Ambient Gradient Orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.45, scale: 1.15 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute -top-10 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.3, scale: 1.1 }}
        transition={{ duration: 1.6, delay: 0.15, ease: "easeOut" }}
        className="absolute bottom-16 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
      />

      {/* Center Emblem with Halo Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative mb-7 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-400/40 via-transparent to-teal-300/40 blur-[1px]"
        />
        <div className="relative w-20 h-20 rounded-3xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-inner">
            <Wallet size={28} className="text-zinc-950" strokeWidth={2.4} />
          </div>
        </div>
      </motion.div>

      {/* Welcome Badge + Title */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
        className="text-center space-y-2.5 relative z-10"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          <Sparkles size={11} />
          <span>Smart Expense Management</span>
        </div>

        <div className="space-y-0.5 pt-1">
          <p className="text-sm font-medium text-zinc-400">Welcome to</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Chandru&apos;s </span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>
        </div>
      </motion.div>

      {/* Staggered Feature Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4, ease: "easeOut" }}
        className="mt-6 flex items-center gap-2 relative z-10"
      >
        {PILLS.map((label) => (
          <span
            key={label}
            className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-medium text-zinc-300"
          >
            {label}
          </span>
        ))}
      </motion.div>

      {/* Smooth 2s Glowing Progress Bar */}
      <div className="mt-9 w-44 h-1 bg-zinc-900 border border-zinc-800/80 rounded-full overflow-hidden relative z-10">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.85, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
        />
      </div>
    </motion.div>
  );
}
