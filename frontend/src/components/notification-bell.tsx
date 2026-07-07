import { useState } from "react";
import { Bell, BellOff, CheckCheck, Info, AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  INITIAL_NOTIFICATIONS,
  timeAgo,
  type Notification,
} from "@/lib/notifications-data";
import { useI18n } from "@/lib/i18n";

const TONE: Record<Notification["tone"], { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "bg-blue-50 text-blue-700" },
  success: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  warning: { icon: AlertTriangle, cls: "bg-amber-50 text-amber-700" },
  critical: { icon: Flame, cls: "bg-red-50 text-red-700" },
};

export function NotificationBell() {
  const { t } = useI18n();
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () => setItems((arr) => arr.map((n) => ({ ...n, read: true })));
  const markOne = (id: string) =>
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("notifications.title")}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {t("notifications.title")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAll}
            disabled={unread === 0}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <CheckCheck className="size-3" />
            {t("notifications.markAll")}
          </button>
        </header>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary">
                <BellOff className="size-4 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                {t("notifications.empty")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("notifications.emptyBody")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = TONE[n.tone].icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markOne(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                        !n.read && "bg-blue-50/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                          TONE[n.tone].cls,
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-foreground">
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
