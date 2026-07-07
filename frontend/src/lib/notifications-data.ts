// Local notifications model (UI-only). Replace with /api/notifications when the
// backend exposes one.

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
  tone: "info" | "success" | "warning" | "critical";
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    title: "Report assigned",
    body: "Your pothole report #RPT-1042 was picked up by a technician.",
    createdAt: minutesAgo(8),
    read: false,
    tone: "info",
  },
  {
    id: "n-2",
    title: "SLA approaching",
    body: "Streetlight ticket TKT-3074 is due in 4 hours.",
    createdAt: minutesAgo(45),
    read: false,
    tone: "warning",
  },
  {
    id: "n-3",
    title: "Report resolved",
    body: "Graffiti report #RPT-1037 has been marked resolved.",
    createdAt: minutesAgo(180),
    read: true,
    tone: "success",
  },
];

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
