import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/session";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (active) setItems((data as Notif[]) ?? []);
    };
    load();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const ch = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (p) => {
          const n = p.new as Notif;
          setItems((prev) => [n, ...prev]);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(n.title, { body: n.body ?? "" });
            } catch {
              /* ignore */
            }
          }
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (!user) return null;
  const unread = items.filter((i) => !i.is_read).length;

  const markAll = async () => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setItems((p) => p.map((i) => ({ ...i, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-16 z-50 rounded-2xl border bg-card p-2 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-bold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Aucune notification
              </p>
            )}
            {items.map((n) => (
              <Link
                key={n.id}
                to={(n.link ?? "/compte") as "/compte"}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-sm hover:bg-muted ${n.is_read ? "" : "bg-secondary/60"}`}
              >
                <div className="font-semibold">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
