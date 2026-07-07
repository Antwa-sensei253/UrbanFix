// Manager workspace helpers. Data comes from the backend.

export type IncomingPriority = "urgent" | "high" | "medium" | "low";

export function priorityKey(u: string): IncomingPriority {
  const v = u.toLowerCase();
  if (v === "critical" || v === "urgent") return "urgent";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

export const URGENCY_DOT: Record<IncomingPriority, string> = {
  urgent: "bg-red-500 ring-red-500/30",
  high: "bg-orange-500 ring-orange-500/30",
  medium: "bg-yellow-500 ring-yellow-500/30",
  low: "bg-emerald-500 ring-emerald-500/30",
};

export const URGENCY_LABEL: Record<IncomingPriority, string> = {
  urgent: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Stable pseudo-random 0..100 coordinate from a report id, used when the
 * backend doesn't supply lat/lng we can project. */
export function seedPos(id: string | number) {
  const key = String(id);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return { x: 6 + (h % 88), y: 6 + ((h >> 7) % 88) };
}

// Legacy exports — empty now that all data is fetched.
export type IncomingReport = never;
export type Technician = never;
export const INCOMING_REPORTS: never[] = [];
export const TECHNICIANS: never[] = [];
export const CATEGORY_LABEL: Record<string, string> = {};
