// UI helpers for the technician Kanban. Data lives in the backend; see
// /api/reports + /api/reports/{id}/status.

export type TicketStatus = "Assigned" | "InProgress" | "Blocked" | "Resolved";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

export const STATUS_COLUMNS: {
  id: TicketStatus;
  name: string;
  dot: string;
}[] = [
  { id: "Assigned", name: "Assigned", dot: "bg-slate-400" },
  { id: "InProgress", name: "In Progress", dot: "bg-blue-500" },
  { id: "Blocked", name: "Blocked", dot: "bg-amber-500" },
  { id: "Resolved", name: "Resolved", dot: "bg-emerald-500" },
];

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; dot: string; pill: string }
> = {
  Critical: {
    label: "Critical",
    dot: "bg-red-500",
    pill: "text-red-700 bg-red-50 border-red-200",
  },
  High: {
    label: "High",
    dot: "bg-orange-500",
    pill: "text-orange-700 bg-orange-50 border-orange-200",
  },
  Medium: {
    label: "Medium",
    dot: "bg-yellow-500",
    pill: "text-yellow-800 bg-yellow-50 border-yellow-200",
  },
  Low: {
    label: "Low",
    dot: "bg-emerald-500",
    pill: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};

export function priorityFromUrgency(u: string): TicketPriority {
  const v = u.toLowerCase();
  if (v === "critical" || v === "urgent") return "Critical";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  return "Low";
}

export function statusFromBackend(s: string): TicketStatus {
  const v = s.toLowerCase().replace(/\s+/g, "");
  if (v === "inprogress") return "InProgress";
  if (v === "blocked") return "Blocked";
  if (v === "resolved") return "Resolved";
  return "Assigned";
}

export function formatSla(
  deadlineISO: string,
  t?: (k: string) => string
): {
  text: string;
  breached: boolean;
  urgent: boolean;
} {
  const ms = new Date(deadlineISO).getTime() - Date.now();
  const breached = ms < 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  let text: string;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    text = `${d}d ${h % 24}h`;
  } else if (h >= 1) {
    text = `${h}h ${m}m`;
  } else {
    text = `${m}m`;
  }
  const overdueStr = t ? t("tech_overdue") : "overdue";
  const leftStr = t ? t("tech_left") : "left";
  return {
    text: breached ? `${text} ${overdueStr}` : `${text} ${leftStr}`,
    breached,
    urgent: !breached && ms < 4 * 3600_000,
  };
}

// Legacy exports kept to avoid breaking lingering imports.
export type Ticket = never;
export const SAMPLE_TICKETS: never[] = [];
