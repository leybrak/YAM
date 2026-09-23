import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  fetchVapidPublicKey,
  markAllNotificationsRead,
  markNotificationRead,
  subscribePushOnServer,
} from "../api/endpoints";
import type { Notification } from "../api/types";
import { getExistingSubscription, isPushSupported, registerServiceWorker, subscribeToPush } from "../lib/push";

const POLL_INTERVAL_MS = 20_000;

export function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const count = await fetchUnreadNotificationCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // sesión vencida u offline: se reintenta en el próximo ciclo
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;
    registerServiceWorker()
      .then(() => getExistingSubscription())
      .then((sub) => setPushSubscribed(!!sub))
      .catch(() => setPushSubscribed(null));
  }, []);

  useEffect(() => {
    if (unreadCount > 0 && badgeRef.current) {
      gsap.fromTo(badgeRef.current, { scale: 1.6 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
    }
  }, [unreadCount]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await fetchNotifications();
      setNotifications(list);
    }
  }

  async function handleSelect(n: Notification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    if (n.entry_id) navigate(`/album/${n.entry_id}`);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleEnablePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const vapidKey = await fetchVapidPublicKey();
      if (!vapidKey) return; // backend todavía no configuró sus claves VAPID
      const subscription = await subscribeToPush(vapidKey);
      await subscribePushOnServer(subscription.toJSON() as PushSubscriptionJSON);
      setPushSubscribed(true);
    } catch {
      // el usuario canceló el permiso, o el navegador no pudo suscribirse
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        className="relative text-lg px-2"
        style={{ color: "var(--color-ink-soft)" }}
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span
            ref={badgeRef}
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] text-white"
            style={{ background: "var(--color-accent)", minWidth: 16, height: 16, padding: "0 4px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-lg overflow-hidden z-20"
          style={{ background: "#fffdf9", boxShadow: "0 6px 16px rgba(58, 47, 40, 0.25)" }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "var(--color-paper-dark)" }}
          >
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs" style={{ color: "var(--color-accent)" }}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {pushSubscribed === false && (
            <div className="px-3 py-2 border-b text-xs" style={{ borderColor: "var(--color-paper-dark)" }}>
              <button onClick={handleEnablePush} disabled={pushBusy} style={{ color: "var(--color-accent)" }}>
                {pushBusy ? "Activando..." : "🔔 Activar avisos en este dispositivo"}
              </button>
            </div>
          )}
          {pushSubscribed === true && (
            <div
              className="px-3 py-2 border-b text-xs"
              style={{ borderColor: "var(--color-paper-dark)", color: "var(--color-ink-soft)" }}
            >
              ✓ Avisos activados en este dispositivo
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--color-ink-soft)" }}>
                Todavía no hay novedades.
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelect(n)}
                className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                style={{
                  borderColor: "var(--color-paper-dark)",
                  background: n.is_read ? "transparent" : "var(--color-paper)",
                }}
              >
                <p>{n.message}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>
                  {new Date(n.created_at).toLocaleString("es-AR")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
