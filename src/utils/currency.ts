// Currency and formatting utilities

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function formatINRSigned(amount: number): string {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}${formatINR(amount)}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getRemainingDaysInMonth(): number {
  const now = new Date();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
  return daysInMonth - now.getDate() + 1;
}

export function getDailySpendLimit(spendBucket: number): number {
  const remaining = getRemainingDaysInMonth();
  return remaining > 0 ? spendBucket / remaining : 0;
}

export function getSpendHealthColor(
  currentSpend: number,
  totalSpend: number
): string {
  if (totalSpend <= 0) return "#10b981"; // emerald
  const ratio = currentSpend / totalSpend;
  if (ratio > 0.5) return "#10b981"; // emerald green
  if (ratio > 0.2) return "#f59e0b"; // amber
  return "#ef4444"; // crimson red
}

export function isoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getDaysBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = parseISODate(from);
  const end = parseISODate(to);
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    dates.push(isoDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
