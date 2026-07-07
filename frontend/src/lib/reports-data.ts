// Visual constants for citizen-side report rendering. Live data comes from
// the backend via @/lib/api.

import type { ReportResponse } from "@/lib/api";

export type ReportUiUrgency = "low" | "medium" | "high" | "critical";
export type ReportUiStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; slaHours: number }
> = {
  Pothole: { label: "Pothole", emoji: "🕳️", slaHours: 48 },
  Streetlight: { label: "Streetlight", emoji: "💡", slaHours: 24 },
  Graffiti: { label: "Graffiti", emoji: "🎨", slaHours: 72 },
  "Trash / Debris": { label: "Trash / Debris", emoji: "🗑️", slaHours: 12 },
  "Fallen tree": { label: "Fallen tree", emoji: "🌳", slaHours: 6 },
  "Damaged signage": { label: "Damaged signage", emoji: "🪧", slaHours: 24 },
  "Water leak": { label: "Water leak", emoji: "💧", slaHours: 4 },
  Other: { label: "Other", emoji: "📍", slaHours: 72 },
};

export function categoryMeta(name: string) {
  return CATEGORY_META[name] ?? { label: name, emoji: "📍", slaHours: 48 };
}

export function normalizeUrgency(u: string): ReportUiUrgency {
  const v = u.toLowerCase();
  if (v === "critical" || v === "urgent") return "critical";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

export function normalizeStatus(s: string): ReportUiStatus {
  const v = s.toLowerCase().replace(/\s+/g, "_");
  if (v === "inprogress" || v === "in_progress") return "in_progress";
  if (
    v === "reported" ||
    v === "verified" ||
    v === "assigned" ||
    v === "resolved" ||
    v === "rejected"
  )
    return v;
  return "reported";
}

export function statusMeta(s: ReportUiStatus) {
  switch (s) {
    case "reported":
      return { label: "Reported", tone: "primary" as const };
    case "verified":
      return { label: "Verified", tone: "primary" as const };
    case "assigned":
      return { label: "Assigned", tone: "primary" as const };
    case "in_progress":
      return { label: "In progress", tone: "warning" as const };
    case "resolved":
      return { label: "Resolved", tone: "success" as const };
    case "rejected":
      return { label: "Rejected", tone: "destructive" as const };
  }
}

export function urgencyMeta(u: ReportUiUrgency) {
  switch (u) {
    case "low":
      return { label: "Low", tone: "muted" as const };
    case "medium":
      return { label: "Medium", tone: "primary" as const };
    case "high":
      return { label: "High", tone: "warning" as const };
    case "critical":
      return { label: "Critical", tone: "destructive" as const };
  }
}

export function slaDeadline(createdAt: string, category: string): Date {
  const meta = categoryMeta(category);
  return new Date(new Date(createdAt).getTime() + meta.slaHours * 3600_000);
}

export function formatDeadline(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * SLA badge metadata for a report card. `overdue` is red, `urgent` (<4h left)
 * is orange, otherwise muted.
 */
export function slaChip(report: ReportResponse) {
  const status = normalizeStatus(report.status);
  if (status === "resolved" || status === "rejected") return null;
  const deadline = slaDeadline(report.created_at, report.category);
  const ms = deadline.getTime() - Date.now();
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  const d = Math.floor(h / 24);

  let text: string;
  if (h >= 24) text = `${d}d ${h % 24}h`;
  else if (h >= 1) text = `${h}h ${m}m`;
  else text = `${m}m`;

  return {
    overdue,
    urgent: !overdue && ms < 4 * 3600_000,
    text: overdue ? `Overdue by ${text}` : `Due in ${text}`,
  };
}

// Re-exported for legacy imports — kept empty so consumers don't crash if
// they still reference these symbols. Live data comes from /api/reports.
export const DISTRICTS: string[] = [];
export const SAMPLE_REPORTS: ReportResponse[] = [];
export const CURRENT_USER = { id: 0, name: "", district: "" };
export type Report = ReportResponse;
export type ReportCategory = string;
export type ReportStatus = ReportUiStatus;
export type ReportUrgency = ReportUiUrgency;
