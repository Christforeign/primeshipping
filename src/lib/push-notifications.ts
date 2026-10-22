// Native Browser Push Notifications & In-App Alerts for Prime Entreprise (Prime Shipping & Prime Store)
import { notificationService } from "./notifications";
import { supabase } from "@/integrations/supabase/client";

export type PushPermissionState = NotificationPermission | "unsupported";

const STORAGE_KEY_PUSH_ENABLED = "prime_push_notifications_enabled";
const BROADCAST_EVENT = "prime_broadcast_notification";

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPushPermissionStatus(): PushPermissionState {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem(STORAGE_KEY_PUSH_ENABLED, "true");
      // Optional sound / small vibration for feedback
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      sendLocalPush("Prime Notifications activées !", {
        body: "Vous recevrez des alertes en direct dès qu'un colis arrive à Miami ou change d'état.",
        icon: "/favicon.ico",
      });
    } else {
      localStorage.setItem(STORAGE_KEY_PUSH_ENABLED, "false");
    }
    return perm;
  } catch {
    return "denied";
  }
}

export function sendLocalPush(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    url?: string;
  },
): boolean {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    // Vibrate device on Android / mobile
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([150, 75, 150]);
      } catch {
        /* ignore */
      }
    }

    const notifOptions: NotificationOptions = {
      icon: options?.icon || "/favicon.ico",
      badge: options?.badge || "/favicon.ico",
      tag: options?.tag || `prime-notif-${Date.now()}`,
    };
    if (options?.body) notifOptions.body = options.body;
    if (options?.data) notifOptions.data = options.data;

    const n = new Notification(title, notifOptions);

    if (options?.url) {
      n.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
      };
    }
    return true;
  } catch {
    // Fallback: try Service Worker notification if available
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const swOptions: NotificationOptions = {
            icon: options?.icon || "/favicon.ico",
            badge: options?.badge || "/favicon.ico",
          };
          if (options?.body) swOptions.body = options.body;
          if (options?.tag) swOptions.tag = options.tag;
          if (options?.data) swOptions.data = options.data;
          void reg.showNotification(title, swOptions);
        })
        .catch(() => {});
    }
    return false;
  }
}

/**
 * Trigger notification on package status change (e.g. Reçu à Miami, En vol, Arrivé en Haïti)
 */
export async function notifyPackageStatusChange(
  tracking: string,
  statusLabel: string,
  options?: {
    userId?: string;
    description?: string;
  },
) {
  const title = "Prime Shipping : Colis mis à jour";
  const body = `Votre colis ${tracking}${
    options?.description ? ` (${options.description})` : ""
  } est maintenant : ${statusLabel}.`;

  // 1. Native push notification
  sendLocalPush(title, {
    body,
    icon: "/favicon.ico",
    url: `/suivi?num=${encodeURIComponent(tracking)}`,
  });

  // 2. In-app notification service
  notificationService.addNotification({
    title,
    message: body,
    type: "colis",
    link: `/suivi?num=${encodeURIComponent(tracking)}`,
  });

  // 3. User notifications Supabase table (if userId provided)
  if (options?.userId) {
    try {
      await supabase.from("user_notifications").insert({
        user_id: options.userId,
        title,
        body,
        link: `/suivi?num=${encodeURIComponent(tracking)}`,
        is_read: false,
      });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Trigger notification when a new package is created for a client
 */
export async function notifyNewPackage(
  tracking: string,
  options?: {
    userId?: string;
    merchant?: string;
    weightLb?: number;
  },
) {
  const title = "Prime Shipping : Nouveau colis reçu à Miami !";
  const body = `Un colis ${options?.merchant ? `en provenance de ${options.merchant} ` : ""}a été enregistré sous le numéro ${tracking}${
    options?.weightLb ? ` (${options.weightLb} lb)` : ""
  }.`;

  sendLocalPush(title, {
    body,
    icon: "/favicon.ico",
    url: `/suivi?num=${encodeURIComponent(tracking)}`,
  });

  notificationService.addNotification({
    title,
    message: body,
    type: "colis",
    link: `/suivi?num=${encodeURIComponent(tracking)}`,
  });

  if (options?.userId) {
    try {
      await supabase.from("user_notifications").insert({
        user_id: options.userId,
        title,
        body,
        link: `/suivi?num=${encodeURIComponent(tracking)}`,
        is_read: false,
      });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Trigger notification on Assisted Purchase update
 */
export function notifyAssistedPurchaseUpdate(
  requestNumber: string,
  statusLabel: string,
  userId?: string,
) {
  const title = `Achat Assisté #${requestNumber}`;
  const body = `Votre demande d'achat est passée au statut : ${statusLabel}.`;

  sendLocalPush(title, {
    body,
    icon: "/favicon.ico",
    url: "/achat",
  });

  notificationService.addNotification({
    title,
    message: body,
    type: "achat",
    link: "/achat",
  });

  if (userId) {
    void supabase.from("user_notifications").insert({
      user_id: userId,
      title,
      body,
      link: "/achat",
      is_read: false,
    });
  }
}

/**
 * Broadcast notification from Admin to all clients
 */
export async function broadcastPushNotification(
  title: string,
  message: string,
  link: string = "/",
) {
  // 1. Emit local push if permission is granted
  sendLocalPush(title, {
    body: message,
    icon: "/favicon.ico",
    url: link,
  });

  // 2. Add in local notification service
  notificationService.addNotification({
    title,
    message,
    type: "info",
    link,
  });

  // 3. Dispatch broadcast custom event for active client tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(BROADCAST_EVENT, {
        detail: { title, message, link, timestamp: new Date().toISOString() },
      }),
    );
  }

  // 4. Insert in Supabase user_notifications for all registered profiles if available
  try {
    const { data: profiles } = await supabase.from("profiles").select("id").limit(200);
    if (profiles && profiles.length > 0) {
      const rows = profiles.map((p) => ({
        user_id: p.id,
        title,
        body: message,
        link,
        is_read: false,
      }));
      await supabase.from("user_notifications").insert(rows);
    }
  } catch {
    /* ignore fallback */
  }
}
