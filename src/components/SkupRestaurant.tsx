
"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Heart, MapPin, QrCode, Share2, Star, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addFavorite,
  createBooking,
  createReview,
  getAvailability,
  getEvents,
  getFavorites,
  getMenu,
  getRestaurant,
  getReviews,
  login,
  removeFavorite,
  type Availability,
  type MenuCategory,
  type Restaurant,
  type RestaurantEvent,
  type Review,
} from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";
import { addBookingToCalendar, bookingCountdown, bookingQrUrl, estimateWaitTime, restaurantPhoto, trackRecentlyViewed } from "@/lib/lukmaUtils";

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
}

function formatTime(value?: string | null) {
  return value ? String(value).slice(0, 5) : "—";
}

export default function SkupRestaurant() {
  const [id, setId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingState, setBookingState] = useState<"idle"|"login"|"submitting"|"success"|"error">("idle");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [countdown, setCountdown] = useState("");
  const bookingSubmitRef = useRef(false);

  useEffect(() => {
    const nextId = new URLSearchParams(window.location.search).get("id") || "";
    setId(nextId);
    if (!nextId) { setLoading(false); return; }
    Promise.all([getRestaurant(nextId), getMenu(nextId), getReviews(nextId), getEvents(nextId)])
      .then(([r,m,rv,ev]) => {
        setRestaurant(r);
        trackRecentlyViewed(r);
        setMenu(m || []);
        setReviews(rv?.data || []);
        setEvents((ev || []).filter(x => x.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncFavorite = () => {
      const token = localStorage.getItem("skup_access_token");
      if (!token || !id) {
        setFavorite(false);
        return;
      }
      getFavorites(token).then(list => setFavorite(list.some(r => r.id === id))).catch(() => setFavorite(false));
    };
    syncFavorite();
    window.addEventListener("skup-auth-changed", syncFavorite);
    return () => window.removeEventListener("skup-auth-changed", syncFavorite);
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    getAvailability(id, date, guests)
      .then(result => {
        if (cancelled) return;
        setAvailability(result);
        const first = result.slots.find(slot => slot.available);
        setTime(prev => result.slots.some(slot => slot.available && slot.time === prev) ? prev : (first?.time || ""));
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability(null);
          setTime("");
          setAvailabilityError("Could not load available times.");
        }
      })
      .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    return () => { cancelled = true; };
  }, [id, date, guests]);

  const photos = useMemo(() => {
    if (!restaurant) return [];
    const all = (restaurant.photos || []).filter(p => p.url).sort((a,b) => Number(a.sortOrder||0) - Number(b.sortOrder||0));
    if (all.length) return all;
    return [{id:"cover",url:restaurantPhoto(restaurant)}];
  }, [restaurant]);

  const days = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [...(restaurant?.workingHours || [])].sort((a,b) => a.day - b.day).map(h => ({
      label: labels[h.day] || "?",
      open: h.isClosed ? "Closed" : formatTime(h.open) + "–" + formatTime(h.close),
    }));
  }, [restaurant]);

  async function sendBooking(token: string) {
    if (bookingSubmitRef.current) return;
    const today = todayISO();
    const normalizedGuests = Number(guests);
    const selectedTime = String(time || "").slice(0, 5);

    if (!id) {
      setAvailabilityError("Restaurant information is missing. Please reload the page.");
      setBookingState("error");
      return;
    }
    if (!date || date < today) {
      setAvailabilityError("Choose today or a future date.");
      setBookingState("error");
      return;
    }
    if (!Number.isInteger(normalizedGuests) || normalizedGuests < 1 || normalizedGuests > 12) {
      setAvailabilityError("Choose between 1 and 12 guests.");
      setBookingState("error");
      return;
    }
    if (!selectedTime) {
      setAvailabilityError("Choose an available time.");
      setBookingState("error");
      return;
    }
    if (comment.length > 200) {
      setAvailabilityError("Your note is too long.");
      setBookingState("error");
      return;
    }

    bookingSubmitRef.current = true;
    setBookingState("submitting");
    setAvailabilityError("");
    try {
      const freshAvailability = await getAvailability(id, date, normalizedGuests);
      const freshSlot = freshAvailability.slots.find(slot => String(slot.time).slice(0, 5) === selectedTime);
      setAvailability(freshAvailability);

      if (!freshAvailability.open || !freshSlot?.available) {
        setTime(prev => prev === selectedTime ? "" : prev);
        setAvailabilityError("That time was just taken. Please choose another available time.");
        setBookingState("error");
        return;
      }

      await createBooking(token, {
        restaurant_id: id,
        date,
        time: selectedTime,
        guests_count: normalizedGuests,
        comment: comment.trim() || undefined,
      });
      setBookingState("success");
    } finally {
      bookingSubmitRef.current = false;
    }
  }

  async function submitBooking() {
    const token = localStorage.getItem("skup_access_token");
    if (!token) { setBookingState("login"); return; }
    try {
      await sendBooking(token);
    } catch (e) {
      setBookingState("error");
      setAvailabilityError(e instanceof Error ? e.message : "Could not submit booking.");
      if (id && date) {
        getAvailability(id, date, guests)
          .then(setAvailability)
          .catch(() => {});
      }
    }
  }

  async function submitLogin() {
    setLoginError("");
    try {
      const result = await login(loginIdentifier.trim(), loginPassword);
      localStorage.setItem("skup_access_token", result.tokens.access_token);
      localStorage.setItem("skup_refresh_token", result.tokens.refresh_token);
      localStorage.setItem("skup_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("skup-auth-changed"));
      await sendBooking(result.tokens.access_token);
    } catch (e) {
      setLoginError(e instanceof Error && e.message.includes("EMAIL_NOT_VERIFIED")
        ? "Your email is not verified yet. Complete verification in your account."
        : e instanceof Error ? e.message : "Login failed");
      setBookingState("login");
    }
  }

  async function submitReview() {
    const token = localStorage.getItem("skup_access_token");
    if (!token) {
      window.location.href = "/account/?mode=login";
      return;
    }
    setReviewBusy(true);
    setReviewMessage("");
    try {
      await createReview(token, {
        restaurant_id: id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const [freshReviews, freshRestaurant] = await Promise.all([getReviews(id), getRestaurant(id)]);
      setReviews(freshReviews?.data || []);
      setRestaurant(freshRestaurant);
      setReviewComment("");
      setReviewRating(5);
      setReviewMessage("Review published.");
    } catch (e) {
      setReviewMessage(e instanceof Error ? e.message : "Could not submit review.");
    } finally {
      setReviewBusy(false);
    }
  }

  async function toggleFavorite() {
    const token = localStorage.getItem("skup_access_token");
    if (!token) { window.location.href = "/account/"; return; }
    setFavoriteBusy(true);
    try {
      if (favorite) { await removeFavorite(token,id); setFavorite(false); }
      else { await addFavorite(token,id); setFavorite(true); }
    } catch {} finally { setFavoriteBusy(false); }
  }

  async function shareRestaurant() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: restaurant?.name || "LUKMA", text: "Check out this place on LUKMA", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        window.alert("Link copied.");
      }
    } catch {}
  }

  const currentPhoto = photos[photoIndex]?.url;
  const availableSlots = availability?.slots.filter(s => s.available) || [];

  useEffect(() => {
    if (bookingState !== "success") return;
    const tick = () => setCountdown(bookingCountdown(date, time));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [bookingState, date, time]);

  if (loading) return <div className="skup-site"><SkupHeader/><div className="page-loading">Loading...</div></div>;
  if (!restaurant) return <div className="skup-site"><SkupHeader/><div className="page-loading"><h2>Restaurant not found</h2><Link href="/discover/">← Back to Discover</Link></div></div>;

  const avg = Number(restaurant.ratingAvg || 0);
  const isOpen = Boolean(restaurant.isOpen);
  const waitTime = estimateWaitTime(restaurant);

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="restaurant-page">
        <div className="restaurant-detail-top shell">
          <Link href="/discover/" className="back-link"><ArrowLeft size={15}/> Back to Discover</Link>
          <div className="restaurant-gallery">
            <div className="gallery-main">
              {currentPhoto ? <img src={currentPhoto} alt={restaurant.name}/> : <div className="gallery-fallback">LUKMA</div>}
              <div className="gallery-count">{photoIndex+1} / {Math.max(1, photos.length)}</div>
              {photos.length > 1 ? <div className="gallery-arrows"><button onClick={() => setPhotoIndex((photoIndex-1+photos.length)%photos.length)}><ChevronLeft size={18}/></button><button onClick={() => setPhotoIndex((photoIndex+1)%photos.length)}><ChevronRight size={18}/></button></div> : null}
            </div>
            <div className="gallery-thumbs">{photos.slice(0,4).map((p,i) => <button key={p.id} onClick={() => setPhotoIndex(i)} className={i===photoIndex ? "active":""}><img src={p.url} alt="" /></button>)}{photos.length > 4 ? <div className="gallery-more">+{photos.length-4}</div> : null}</div>
          </div>
        </div>

        <section className="restaurant-info shell">
          <div className="restaurant-main-copy">
            <div className="restaurant-badges">
              {restaurant.discountPercent ? <span className="badge-deal">-{restaurant.discountPercent}% offer</span> : null}
              <span className={"badge-open " + (!isOpen ? "closed" : "")}><span/> {isOpen ? "Open now" : "Closed now"}</span>
            </div>
            <h1>{restaurant.name}</h1>
            <div className="restaurant-subline">{restaurant.cuisine?.name || "Restaurant"} <span>·</span> {restaurant.district || restaurant.city}</div>
            <div className="restaurant-rating-line"><Star size={14} fill="currentColor"/><strong>{avg.toFixed(1)}</strong><span>({restaurant.reviewsCount} reviews)</span><span className="dot"/> <MapPin size={14}/><span>{restaurant.address}</span></div>
            <div className="restaurant-actions">
              <button onClick={toggleFavorite} disabled={favoriteBusy} className="outline-btn"><Heart size={15} fill={favorite ? "currentColor":"none"}/> {favorite ? "Saved" : "Save"}</button>
              <button className="outline-btn" onClick={shareRestaurant}><Share2 size={15}/> Share</button>
              <a className="outline-btn" href={"https://www.google.com/maps/search/?api=1&query="+restaurant.latitude+","+restaurant.longitude} target="_blank" rel="noreferrer"><MapPin size={15}/> Directions</a>
            </div>
            {waitTime !== null ? <div className="live-wait"><Clock3 size={14}/><strong>~{waitTime} min wait</strong><span>Estimated from current demand</span><i style={{width:Math.min(100,waitTime*2.4)+"%"}}/></div> : null}
          </div>

          <aside className="booking-card">
            <div className="booking-kicker">Book a table</div>
            <h2>Reserve your evening</h2>
            <label>Date<input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)}/></label>
            <label>Guests<div className="stepper"><button onClick={() => setGuests(g => Math.max(1,g-1))}>−</button><strong>{guests}</strong><button onClick={() => setGuests(g => Math.min(12,g+1))}>+</button><span><Users size={13}/> guest</span></div></label>
            <label>Preferred time</label>
            {availabilityLoading ? <div className="time-loading">Loading available times…</div> :
              availability?.open === false ? <div className="time-empty">The restaurant is closed on this date.</div> :
              availableSlots.length && availability ? <div className="time-grid">{availability.slots.map(slot => <button key={slot.time} disabled={!slot.available} onClick={() => setTime(slot.time)} className={slot.time===time ? "active":""}>{slot.time}</button>)}</div> :
              <div className="time-empty">No available times remain for this date.</div>}
            {availabilityError ? <div className="booking-inline-error">{availabilityError}</div> : null}
            <label className="booking-comment">Note<textarea value={comment} onChange={e => setComment(e.target.value.slice(0,200))} placeholder="Allergy, birthday, special request..." /></label>
            <button className="booking-submit" onClick={submitBooking} disabled={bookingState==="submitting" || !time || availabilityLoading}>{bookingState==="submitting" ? "Sending..." : "Continue"} <span>→</span></button>
            <div className="booking-note"><CheckCircle2 size={13}/> Your request is sent to the restaurant for confirmation</div>
          </aside>
        </section>

        <section className="restaurant-body shell">
          <div className="restaurant-content">
            <div className="detail-tabs"><a href="#overview" className="active">Overview</a><a href="#menu">Menu</a><a href="#photos">Photos</a><a href="#reviews">Reviews</a><a href="#location">Location</a></div>

            <article id="overview" className="detail-section">
              <div className="section-title-small">About</div>
              <p>{restaurant.description || "Restaurant description coming soon."}</p>
              <div className="feature-facts">
                <span><MapPin size={15}/> {restaurant.district || restaurant.city}</span>
                <span><Clock3 size={15}/> {isOpen ? "Open now" : "Closed now"}</span>
              </div>
              {days.length ? <div className="hours-grid">{days.map(day => <div key={day.label}><span>{day.label}</span><strong>{day.open}</strong></div>)}</div> : null}
            </article>

            {events.length ? <article className="detail-section"><div className="section-title-small">Upcoming events</div><div className="event-row">{events.map(ev => <div key={ev.id} className="event-card"><span>{ev.emoji || "✦"}</span><div><strong>{ev.title}</strong>{ev.description ? <p>{ev.description}</p> : null}{ev.eventDate ? <small>{ev.eventDate}</small> : null}</div></div>)}</div></article> : null}

            <article id="menu" className="detail-section">
              <div className="section-title-small">Menu</div>
              {menu.length ? <div className="menu-list">{menu.map(cat => <div key={cat.id} className="menu-category"><h3>{cat.name}</h3>{cat.items.map(item => <div key={item.id} className={"menu-item " + (item.isAvailable ? "" : "muted")}><div>{item.photoUrl ? <img src={item.photoUrl} alt="" /> : null}<div><strong>{item.name}</strong>{item.description ? <p>{item.description}</p> : null}</div></div><span>₾{Number(item.price).toFixed(0)}</span></div>)}</div>)}</div> : <p className="muted-copy">Menu has not been added yet.</p>}
            </article>

            <article id="reviews" className="detail-section">
              <div className="section-title-small">Reviews <span>{restaurant.reviewsCount}</span></div>
              <div className="review-compose">
                <div className="review-compose-head"><strong>Rate this place</strong><span>1–5 stars</span></div>
                <div className="review-stars">{[1,2,3,4,5].map(value => <button key={value} type="button" aria-label={value + " stars"} className={value <= reviewRating ? "active" : ""} onClick={() => setReviewRating(value)}><Star size={18} fill="currentColor"/></button>)}</div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value.slice(0,1000))} placeholder="What did you like? What would you recommend to others?" />
                {reviewMessage ? <div className="review-message">{reviewMessage}</div> : null}
                <button className="green-btn small" onClick={submitReview} disabled={reviewBusy}>{reviewBusy ? "Sending…" : "Publish"}</button>
              </div>
              {reviews.length ? <div className="reviews-list">{reviews.slice(0,8).map(rv => <div key={rv.id} className="review-row"><div className="review-avatar">{(rv.reviewerName || rv.user?.name || "S").slice(0,1)}</div><div><div className="review-head"><strong>{rv.reviewerName || rv.user?.name || "guest"}</strong><span><Star size={11} fill="currentColor"/> {rv.rating}</span></div><p>{rv.comment || ""}</p></div></div>)}</div> : <p className="muted-copy">No published reviews yet.</p>}
            </article>

            <article id="photos" className="detail-section"><div className="section-title-small">Photos</div>{photos.length ? <div className="detail-photo-grid">{photos.map(p => <img key={p.id} src={p.url} alt={restaurant.name} loading="lazy" />)}</div> : <p className="muted-copy">No photos have been added yet.</p>}</article>

            <article id="location" className="detail-section"><div className="section-title-small">Location</div><div className="location-card"><div><MapPin size={18}/><strong>{restaurant.address}</strong><span>{restaurant.city}{restaurant.district ? " · " + restaurant.district : ""}</span></div><a href={"https://www.google.com/maps/search/?api=1&query="+restaurant.latitude+","+restaurant.longitude} target="_blank" rel="noreferrer">Google Maps →</a></div></article>
          </div>
        </section>
      </main>

      {bookingState==="login" ? <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setBookingState("idle")}}><div className="auth-modal"><button className="modal-close" onClick={() => setBookingState("idle")}>×</button><span className="kicker">Continue booking</span><h2>Log in to your LUKMA account</h2><p>You need to be logged in to submit a booking.</p><input value={loginIdentifier} onChange={e=>setLoginIdentifier(e.target.value)} placeholder="Email or phone"/><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} type="password" placeholder="Password"/>{loginError ? <div className="inline-error">{loginError}</div> : null}<button className="booking-submit" onClick={submitLogin}>Log in and book <span>→</span></button><Link href="/account/?mode=register" className="modal-alt-link">Create an account</Link></div></div> : null}
      {bookingState==="success" ? <div className="modal-backdrop"><div className="auth-modal success-modal"><div className="success-icon"><CheckCircle2 size={27}/></div><span className="kicker">BOOKING REQUEST SENT</span><h2>Thank you!</h2><p>{restaurant.name} · {date} · {time} · {guests} guest{guests===1?"":"s"}</p><div className="success-countdown"><Clock3 size={15}/><span>Awaiting restaurant confirmation</span></div><div className="success-note">Your request is now in My Bookings. Once the restaurant confirms it, your check-in QR and calendar action become available there.</div><Link href="/bookings/" className="booking-submit">Open my bookings <span>→</span></Link><button className="modal-alt-link" onClick={() => setBookingState("idle")}>Stay here</button></div></div> : null}
      {showQr ? <div className="modal-backdrop" onClick={() => setShowQr(false)}><div className="modal-card qr-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowQr(false)}>×</button><div className="kicker">CHECK-IN QR</div><h2>Show this at the restaurant</h2><img className="booking-qr-image" src={bookingQrUrl({restaurantName:restaurant.name,date,time,guests})} alt="Booking check-in QR"/><div className="qr-details"><strong>{restaurant.name}</strong><span>{date} · {time}</span><span>{guests} guests</span></div></div></div> : null}
      {bookingState==="error" ? <div className="modal-backdrop"><div className="auth-modal"><button className="modal-close" onClick={() => setBookingState("idle")}>×</button><span className="kicker">Booking</span><h2>Could not send</h2><p>{availabilityError || "Please try again."}</p><button className="booking-submit" onClick={() => setBookingState("idle")}>OK</button></div></div> : null}
    </div>
  );
}
