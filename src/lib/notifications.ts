// @ts-nocheck
import type { AppNotification } from "./types-store";

const NOTIF_STORAGE_KEY = "jul_app_notifications";
const NOTIF_EVENT = "jul_notifications_updated";

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Bienvenue sur Prime Entreprise",
    message:
      "Votre compte est prêt. Vous pouvez expédier vos colis et faire des achats assistés dès aujourd'hui.",
    type: "info",
    link: "/services",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-2",
    title: "Service Achetez pour moi disponible",
    message:
      "Envoyez l'image ou le lien de n'importe quel site (Amazon, Shein, eBay). Déduction automatique sur solde après vérification.",
    type: "achat",
    link: "/achat",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "notif-3",
    title: "Expédition Miami ➔ Haïti en cours",
    message:
      "Le prochain vol régulier décolle ce jeudi. Déclarez vos paquets reçus à l'adresse internationale.",
    type: "colis",
    link: "/suivi",
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const notificationService = {
  getAll(): AppNotification[] {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
        return DEFAULT_NOTIFICATIONS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  },

  getUnreadCount(): number {
    return this.getAll().filter((n) => !n.is_read).length;
  },

  addNotification(notif: Omit<AppNotification, "id" | "created_at" | "is_read">): AppNotification {
    const list = this.getAll();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    list.unshift(newNotif);
    this.saveAll(list);

    // Trigger System / Device Notification if permitted
    this.sendSystemPush(newNotif.title, newNotif.message);

    return newNotif;
  },

  markAsRead(id: string) {
    const list = this.getAll().map((n) => (n.id === id ? { ...n, is_read: true } : n));
    this.saveAll(list);
  },

  markAllAsRead() {
    const list = this.getAll().map((n) => ({ ...n, is_read: true }));
    this.saveAll(list);
  },

  deleteNotification(id: string) {
    const list = this.getAll().filter((n) => n.id !== id);
    this.saveAll(list);
  },

  clearAll() {
    this.saveAll([]);
  },

  saveAll(list: AppNotification[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event(NOTIF_EVENT));
    } catch (e) {
      console.error(e);
    }
  },

  // -----------------------------------------------------------
  // DEVICE PUSH & NATIVE SYSTEM NOTIFICATIONS (Android, iOS, PC)
  // -----------------------------------------------------------
  async requestDevicePermission(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return "denied";
    }
  },

  getPermissionStatus(): NotificationPermission | "unsupported" {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  },

  sendSystemPush(title: string, body: string) {
    if (typeof window === "undefined") return;

    // Vibrate device if supported (Android, compatible mobiles)
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Safe ignore
      }
    }

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      } catch (err) {
        // Fallback for mobile service worker if available
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(title, { body, icon: "/favicon.ico" });
            })
            .catch(() => {});
        }
      }
    }
  },
};
