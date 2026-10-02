"use client";

import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

function relativeTime(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ახლა";
  if (mins < 60) return mins + " წთ";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + " სთ";
  return Math.floor(hours / 24) + " დ";
}

export default function SkupNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("skup_access_token");
    if (!token) return;

    setLoading(true);
    setError("");
    getNotifications(token)
      .then(result => {
        if (cancelled) return;
        setItems(result.data || []);
        setUnread(result.unreadCount || 0);
      })
      .catch(e => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "შეტყობინებების ჩატვირთვა ვერ მოხერხდა.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function load() {
    const token = localStorage.getItem("skup_access_token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await getNotifications(token);
      setItems(result.data || []);
      setUnread(result.unreadCount || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეტყობინებების ჩატვირთვა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  }

  async function read(id: string) {
    const token = localStorage.getItem("skup_access_token");
    if (!token) return;
    try {
      await markNotificationRead(token, id);
      setItems(prev => prev.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnread(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event("skup-notifications-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეტყობინების გახსნა ვერ მოხერხდა.");
    }
  }

  async function openNotification(item: UserNotification) {
    await read(item.id);
    const data = item.data || {};
    if (typeof data.restaurantId === "string") {
      router.push("/restaurant/?id=" + encodeURIComponent(data.restaurantId));
    } else if (typeof data.bookingId === "string") {
      router.push("/bookings/");
    } else if (typeof data.waitlistId === "string") {
      router.push("/waitlist/");
    }
  }

  async function readAll() {
    const token = localStorage.getItem("skup_access_token");
    if (!token || unread === 0) return;
    try {
      await markAllNotificationsRead(token);
      setItems(prev => prev.map(item => item.readAt ? item : { ...item, readAt: new Date().toISOString() }));
      setUnread(0);
      window.dispatchEvent(new Event("skup-notifications-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეტყობინებების მონიშვნა ვერ მოხერხდა.");
    }
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("skup_access_token") : null;

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="shell notifications-page">
        <div className="notifications-head">
          <div>
            <span className="kicker">LUKMA</span>
            <h1>შეტყობინებები</h1>
            <p>ჯავშნები, რესტორნების პასუხები და სხვა მნიშვნელოვანი განახლებები.</p>
          </div>
          {token && unread > 0 ? (
            <button className="outline-btn" onClick={readAll}>
              <CheckCheck size={14}/> ყველას წაკითხულად
            </button>
          ) : null}
        </div>

        {!token ? (
          <div className="empty-state">
            <Bell size={28}/>
            <h3>შესვლა საჭიროა</h3>
            <p>შეტყობინებების სანახავად შედი LUKMA ანგარიშში.</p>
            <Link className="green-btn small" href="/account/?mode=login">შესვლა</Link>
          </div>
        ) : loading ? (
          <div className="notification-skeletons">
            {Array.from({length:5}).map((_, i) => <div key={i} className="notification-skeleton" />)}
          </div>
        ) : error ? (
          <div className="inline-error">
            {error} <button className="outline-btn small" onClick={load}>თავიდან</button>
          </div>
        ) : items.length ? (
          <div className="notification-list">
            {items.map(item => (
              <button
                key={item.id}
                className={"notification-row " + (!item.readAt ? "unread" : "")}
                onClick={() => openNotification(item)}
              >
                <span className="notification-icon"><Bell size={15}/></span>
                <span className="notification-copy">
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                  <em><Clock3 size={11}/>{relativeTime(item.createdAt)}</em>
                </span>
                {!item.readAt ? <i className="notification-unread-dot"/> : <ChevronRight size={15}/>}
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Bell size={28}/>
            <h3>ჯერ შეტყობინებები არ გაქვს</h3>
            <p>აქ გამოჩნდება ჯავშნებთან და LUKMA-ს ანგარიშთან დაკავშირებული განახლებები.</p>
          </div>
        )}
      </main>
    </div>
  );
}
