"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, MessageCircle, QrCode, RefreshCw, Star, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMyBookings, updateBookingStatus, createReview, getRestaurant, type Restaurant } from "@/lib/skupApi";
import { addBookingToCalendar, bookingCountdown, bookingQrUrl, isBookingUpcoming, restaurantPhoto } from "@/lib/lukmaUtils";
import SkupHeader from "./SkupHeader";

type Booking = {
  id: string;
  date: string;
  time: string;
  guestsCount?: number;
  guests_count?: number;
  comment?: string | null;
  status: string;
  restaurant?: Restaurant & { name?: string; address?: string };
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Awaiting confirmation", className: "status-pending" },
  confirmed: { label: "Confirmed", className: "status-confirmed" },
  cancelled: { label: "Cancelled", className: "status-cancelled" },
  rejected: { label: "Rejected", className: "status-rejected" },
};

function sessionToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("skup_access_token");
}

export default function SkupBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!authToken) { setBookings([]); setLoading(false); return; }
    setLoading(true);
    try {
      setBookings((await getMyBookings(authToken)) || []);
    } catch {
      setNotice("Could not load bookings.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const sync = () => setAuthToken(sessionToken());
    sync();
    window.addEventListener("skup-auth-changed", sync);
    return () => window.removeEventListener("skup-auth-changed", sync);
  }, []);

  useEffect(() => { load(); }, [authToken]);

  const filtered = useMemo(() => filter === "all" ? bookings : bookings.filter(b => b.status === filter), [bookings, filter]);

  async function cancel(id: string) {
    const token = sessionToken();
    if (!token || busy) return;
    setBusy(id);
    try {
      await updateBookingStatus(token, id, "cancelled");
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      setNotice("Booking cancelled.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not cancel booking.");
    } finally { setBusy(""); }
  }

  async function submitReview() {
    const token = sessionToken();
    if (!token || !reviewBooking?.restaurant?.id || busy) return;
    setBusy(reviewBooking.id);
    try {
      await createReview(token, {
        restaurant_id: reviewBooking.restaurant.id,
        rating: reviewRating,
        comment: reviewText.trim() || undefined,
      });
      setNotice("Thanks — your review was submitted.");
      setReviewBooking(null);
      setReviewText("");
      setReviewRating(5);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not submit review.");
    } finally { setBusy(""); }
  }

  const isAuthenticated = Boolean(authToken);

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="shell account-page">
        <div className="account-header">
          <div><span className="kicker">BOOKINGS</span><h1>My bookings</h1><p>Keep every reservation, check-in QR, and follow-up in one place.</p></div>
          <div style={{display:"flex",gap:8}}><button className="outline-btn" onClick={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} disabled={loading || refreshing}><RefreshCw className={refreshing ? "spin" : ""} size={14}/> {refreshing ? "Refreshing…" : "Refresh"}</button><Link className="green-btn" href="/discover/">Find a table</Link></div>
        </div>

        {!isAuthenticated ? (
          <div className="account-login-card">
            <div className="account-mark">L</div>
            <span className="kicker">MY LUKMA</span>
            <h1>Sign in to see<br/>your bookings.</h1>
            <p>Your confirmations, QR check-ins and saved plans live here.</p>
            <Link href="/account/" className="green-btn">Log in</Link>
          </div>
        ) : (
          <>
            {notice ? <div className="account-notice account-global-notice">{notice}</div> : null}
            <div className="booking-filter-bar">
              {["all","pending","confirmed","cancelled","rejected"].map(key => <button key={key} className={filter===key ? "active" : ""} onClick={() => setFilter(key)}>{key === "all" ? "All" : STATUS[key]?.label || key}</button>)}
            </div>
            {loading ? <div className="page-loading">Loading bookings…</div> :
              filtered.length ? <div className="booking-list">
                {filtered.map(b => {
                  const restaurant = b.restaurant;
                  const guests = b.guestsCount || b.guests_count || 0;
                  const status = STATUS[b.status] || { label: b.status, className: "status" };
                  return (
                    <article className="booking-card-full" key={b.id}>
                      <div className="booking-card-cover">
                        {restaurant ? <img src={restaurantPhoto(restaurant)} alt="" /> : <div className="restaurant-photo-placeholder">LUKMA</div>}
                      </div>
                      <div className="booking-card-content">
                        <div className="booking-card-top">
                          <div><span className={"status " + status.className}>{status.label}</span><h2>{restaurant?.name || "Restaurant"}</h2><p>{restaurant?.address || "Tbilisi"} · {guests} guest{guests === 1 ? "" : "s"}</p></div>
                          <div className="booking-date-large"><strong>{b.date}</strong><span>{b.time}</span>{b.status==="confirmed" ? <small>{bookingCountdown(b.date,b.time)}</small> : null}</div>
                        </div>
                        {b.comment ? <p className="booking-note">{b.comment}</p> : null}
                        <div className="booking-actions">
                          {b.status === "confirmed" ? <>
                            <button className="outline-btn" onClick={() => addBookingToCalendar({id:b.id,date:b.date,time:b.time,restaurantName:restaurant?.name || "LUKMA",address:restaurant?.address,guests})}><CalendarDays size={14}/> Add to calendar</button>
                            <button className="outline-btn" onClick={() => setQrBooking(b)}><QrCode size={14}/> Check-in QR</button>
                            <Link className="outline-btn" href={"/chat/?booking_id="+encodeURIComponent(b.id)+"&restaurant="+encodeURIComponent(restaurant?.name || "Restaurant")}><MessageCircle size={14}/> Chat</Link>
                          </> : null}
                          {b.status === "confirmed" || b.status === "cancelled" ? <button className="outline-btn" onClick={() => setReviewBooking(b)}><Star size={14}/> Review</button> : null}
                          {b.status === "pending" && isBookingUpcoming(b.date,b.time) ? <button className="outline-btn danger" disabled={busy===b.id} onClick={() => cancel(b.id)}><XCircle size={14}/> {busy===b.id ? "Cancelling…" : "Cancel"}</button> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div> :
              <div className="empty-state"><CalendarDays size={28}/><h3>{bookings.length ? "No matching bookings" : "No bookings yet"}</h3><p>{bookings.length ? "Try another booking status filter." : "Pick a restaurant and reserve your next table in seconds."}</p>{bookings.length ? <button className="outline-btn" onClick={() => setFilter("all")}>Show all bookings</button> : <Link className="green-btn" href="/discover/">Discover restaurants</Link>}</div>
            }
          </>
        )}
      </main>

      {qrBooking ? (
        <div className="modal-backdrop" onClick={() => setQrBooking(null)}>
          <div className="modal-card qr-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setQrBooking(null)}>×</button>
            <div className="kicker">CHECK-IN QR</div>
            <h2>Show this at the restaurant</h2>
            <img className="booking-qr-image" src={bookingQrUrl({bookingId:qrBooking.id,restaurantName:qrBooking.restaurant?.name || "LUKMA",date:qrBooking.date,time:qrBooking.time,guests:qrBooking.guestsCount || qrBooking.guests_count || 0})} alt="Booking check-in QR" />
            <div className="qr-details"><strong>{qrBooking.restaurant?.name || "Restaurant"}</strong><span>{qrBooking.date} · {qrBooking.time}</span><span>{qrBooking.guestsCount || qrBooking.guests_count || 0} guests · #{qrBooking.id.slice(0,8).toUpperCase()}</span></div>
          </div>
        </div>
      ) : null}

      {reviewBooking ? (
        <div className="modal-backdrop" onClick={() => setReviewBooking(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReviewBooking(null)}>×</button>
            <div className="kicker">YOUR VISIT</div>
            <h2>How was {reviewBooking.restaurant?.name || "the restaurant"}?</h2>
            <div className="review-stars">
              {[1,2,3,4,5].map(n => <button key={n} onClick={() => setReviewRating(n)} className={n <= reviewRating ? "active":""}><Star size={28} fill="currentColor"/></button>)}
            </div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value.slice(0,500))} placeholder="Tell other guests about your experience…" />
            <button className="green-btn" onClick={submitReview} disabled={Boolean(busy)}><CheckCircle2 size={15}/> {busy ? "Sending…" : "Submit review"}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
