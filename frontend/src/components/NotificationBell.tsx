import * as React from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch, useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

interface Notification {
  id: number | string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const t = useT();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);
  const [seen, setSeen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch("/notifications/mine", user.token);
      setItems(Array.isArray(data) ? data : (data?.notifications ?? []));
    } catch (e) {
      // silent on poll failures
      console.error(e);
    }
  }, [user]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const unread = items.filter((n) => !n.is_read).length;
  const showDot = unread > 0 && !seen;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setSeen(true);
  };

  // If new unread arrive after viewing, re-show the dot
  React.useEffect(() => {
    if (!open && unread > 0) {
      // keep current seen state; only reset if there are more unread than before viewing
    }
  }, [open, unread]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {showDot && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-2 text-sm font-semibold">{t.notifications}</div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t.no_notifications}
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`border-b px-4 py-2 text-sm last:border-0 ${
                  n.is_read ? "text-muted-foreground" : "font-medium"
                }`}
              >
                {n.message}
                {n.created_at && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function showApiError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Something went wrong";
  toast.error(msg);
}
