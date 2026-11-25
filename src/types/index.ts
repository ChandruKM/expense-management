// Core data types for FlowWallet

export type BucketKey = "needs" | "spend" | "savings";

export interface Buckets {
  needs: number;    // Fixed Bills / Needs
  spend: number;    // Daily Safe-to-Spend
  savings: number;  // Locked Savings Vault
}

export interface BucketSplit {
  needs: number;    // percentage 0-100
  spend: number;    // percentage 0-100
  savings: number;  // percentage 0-100
}

export type TransactionType = "income" | "expense" | "auto" | "self-tax";

export interface Transaction {
  id: string;
  date: string; // ISO date string
  type: TransactionType;
  category: string;
  note: string;
  amount: number; // positive = income, negative = expense
  bucket: BucketKey;
  isAuto?: boolean;
  ruleId?: string;
}

export type AutoRuleFrequency = "monthly" | "daily";

export interface AutoRule {
  id: string;
  name: string;
  amount: number;
  frequency: AutoRuleFrequency;
  dayOfMonth?: number; // 1-31 for monthly
  bucket: BucketKey;
  enabled: boolean;
  lastProcessed?: string; // ISO date string
}

export interface SelfTaxRule {
  enabled: boolean;
  triggerCategory: string;
  penaltyAmount: number;
  targetBucket: BucketKey;
}

export interface WalletState {
  // Core balances
  buckets: Buckets;
  bucketSplit: BucketSplit;

  // Transactions history
  transactions: Transaction[];

  // Auto-deduct rules
  autoRules: AutoRule[];

  // Self-tax rule
  selfTaxRule: SelfTaxRule;

  // Settings
  monthlyIncome: number;
  hourlyRate: number; // for life hours toggle
  currency: string; // "INR"
  lastCheckedDate: string; // ISO date string YYYY-MM-DD

  // UI state (not persisted)
  lifeHoursMode: boolean;
}

export interface QuickChip {
  label: string;
  category: string;
  amount: number;
}

export const DEFAULT_QUICK_CHIPS: QuickChip[] = [
  { label: "Tea ☕", category: "Tea/Coffee", amount: 20 },
  { label: "Lunch 🍱", category: "Food", amount: 120 },
  { label: "Petrol ⛽", category: "Transport", amount: 200 },
  { label: "Groceries 🛒", category: "Groceries", amount: 500 },
  { label: "Swiggy 🛵", category: "Food Delivery / Junk", amount: 250 },
  { label: "Rickshaw 🛺", category: "Transport", amount: 50 },
];

export const BUCKET_LABELS: Record<BucketKey, string> = {
  needs: "Fixed Bills / Needs",
  spend: "Daily Safe-to-Spend",
  savings: "Locked Savings Vault",
};

export const BUCKET_ICONS: Record<BucketKey, string> = {
  needs: "🏠",
  spend: "💳",
  savings: "🔒",
};

export const BUCKET_COLORS: Record<BucketKey, string> = {
  needs: "text-blue-400",
  spend: "text-emerald-400",
  savings: "text-violet-400",
};
