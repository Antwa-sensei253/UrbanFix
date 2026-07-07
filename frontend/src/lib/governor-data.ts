// Light helpers only — all data comes from /api/analytics/summary and friends.

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n).toString();
}

export type RangeKey = "7d" | "30d" | "90d" | "ytd";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

export const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: 365,
};
