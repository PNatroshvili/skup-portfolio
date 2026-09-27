"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Heart, MapPin, Share2, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addFavorite, createBooking, getEvents, getFavorites, getMenu, getRestaurant, getReviews, login, removeFavorite, type MenuCategory, type Restaurant, type RestaurantEvent, type Review } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const times = ["18:00","18:30","19:00","19:30","20:00","20:30","21:00"];

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
  const [time, setTime] = useState("19:00");
  const [comment, setComment] = useState("");
  const [bookingState, setBookingState] = useState<"idle"|"login"|"submitting"|"success"|"error">("idle");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    const nextId = new URLSearchParams(window.location.search).get("id") || "";
    setId(nextId);
    if (!nextId) { setLoading(false); return; }
    Promise.all([getRestaurant(nextId), getMenu(nextId), getReviews(nextId), getEvents(nextId)])
      .then(([r,m,rv,ev]) => {
        setRestaurant(r);
        setMenu(m || []);
        setReviews(rv?.data || []);
        setEvents((ev || []).filter(x => x.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("skup_access_token");
    if (!token || !id) return;
    getFavorites(token).then(list => setFavorite(list.some(r => r.id === id))).catch(() => {});
  }, [id]);

  const photos = useMemo(() => {
    if (!restaurant) return [];
    const all = (restaurant.photos || []).filter(p => p.url).sort((a,b) => Number(a.sortOrder||0) - Number(b.sortOrder||0));
    if (!all.length && restaurant.cover_photo) return [{id:"cover",url:restaurant.cover_photo}];
    return all;
  }, [restaurant]);

  async function submitBooking() {
    const token = localStorage.getItem("skup_access_token");
    if (!token) { setBookingState("login"); return; }
    setBookingState("submitting");
    try {
      await createBooking(token, { restaurant_id:id, date, time, guests_count:guests, comment });
      setBookingState("success");
    } catch { setBookingState("error"); }
  }

  async function submitLogin() {
    setLoginError("");
    try {
      const result = await login(loginIdentifier, loginPassword);
      localStorage.setItem("skup_access_token", result.tokens.access_token);
      localStorage.setItem("skup_refresh_token", result.tokens.refresh_token);
      localStorage.setItem("skup_user", JSON.stringify(result.user));
      setBookingState("submitting");
      await createBooking(result.tokens.access_token, { restaurant_id:id, date, time, guests_count:guests, comment });
      setBookingState("success");
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "შესვლა ვერ მოხერხდა");
      setBookingState("login");
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

  if (loading) return <div className="skup-site"><SkupHeader/><div className="page-loading">იტვირთება...</div></div>;
  if (!restaurant) return <div className="skup-site"><SkupHeader/><div className="page-loading"><h2>რესტორანი ვერ მოიძებნა</h2><Link href="/discover/">← აღმოჩენაზე დაბრუნება</Link></div></div>;

  const currentPhoto = photos[photoIndex]?.url;
  const avg = Number(restaurant.ratingAvg || 0);

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="restaurant-page">
        <div className="restaurant-detail-top shell">
          <Link href="/discover/" className="back-link"><ArrowLeft size={15}/> აღმოჩენაზე დაბრუნება</Link>
          <div className="restaurant-gallery">
            <div className="gallery-main">
              {currentPhoto ? <img src={currentPhoto} alt={restaurant.name}/> : <div className="gallery-fallback">SKUP</div>}
              <div className="gallery-count">{photoIndex+1} / {Math.max(1, photos.length)}</div>
              {photos.length > 1 ? <div className="gallery-arrows"><button onClick={() => setPhotoIndex((photoIndex-1+photos.length)%photos.length)}><ChevronLeft size={18}/></button><button onClick={() => setPhotoIndex((photoIndex+1)%photos.length)}><ChevronRight size={18}/></button></div> : null}
            </div>
            <div className="gallery-thumbs">{photos.slice(0,4).map((p,i) => <button key={p.id} onClick={() => setPhotoIndex(i)} className={i===photoIndex ? "active":""}><img src={p.url} alt="" /></button>)}{photos.length > 4 ? <div className="gallery-more">+{photos.length-4}</div> : null}</div>
          </div>
        </div>

        <section className="restaurant-info shell">
          <div className="restaurant-main-copy">
            <div className="restaurant-badges">{restaurant.discountPercent ? <span className="badge-deal">-{restaurant.discountPercent}% შეთავაზება</span> : null}<span className="badge-open"><span/> ღია გრაფიკზეა</span></div>
            <h1>{restaurant.name}</h1>
            <div className="restaurant-subline">{restaurant.cuisine?.name || "რესტორანი"} <span>·</span> {restaurant.district || restaurant.city}</div>
            <div className="restaurant-rating-line"><Star size={14} fill="currentColor"/><strong>{avg.toFixed(1)}</strong><span>({restaurant.reviewsCount} მიმოხილვა)</span><span className="dot"/> <MapPin size={14}/><span>{restaurant.address}</span></div>
            <div className="restaurant-actions"><button onClick={toggleFavorite} disabled={favoriteBusy} className="outline-btn"><Heart size={15} fill={favorite ? "currentColor":"none"}/> {favorite ? "შენახულია" : "შენახვა"}</button><button className="outline-btn"><Share2 size={15}/> გაზიარება</button><a className="outline-btn" href={"https://www.google.com/maps/search/?api=1&query="+restaurant.latitude+","+restaurant.longitude} target="_blank" rel="noreferrer"><MapPin size={15}/> მიმართულება</a></div>
          </div>

          <aside className="booking-card">
            <div className="booking-kicker">მაგიდის დაჯავშნა</div>
            <h2>დაჯავშნე შენი საღამო</h2>
            <label>თარიღი<input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)}/></label>
            <label>სტუმრები<div className="stepper"><button onClick={() => setGuests(g => Math.max(1,g-1))}>−</button><strong>{guests}</strong><button onClick={() => setGuests(g => Math.min(12,g+1))}>+</button><span><Users size={13}/> სტუმარი</span></div></label>
            <label>სასურველი დრო<div className="time-grid">{times.map(t => <button key={t} onClick={() => setTime(t)} className={t===time ? "active":""}>{t}</button>)}</div></label>
            <label className="booking-comment">შენიშვნა<textarea value={comment} onChange={e => setComment(e.target.value.slice(0,200))} placeholder="ალერგია, დაბადების დღე, სპეციალური მოთხოვნა..." /></label>
            <button className="booking-submit" onClick={submitBooking} disabled={bookingState==="submitting"}>{bookingState==="submitting" ? "იგზავნება..." : "გაგრძელება"} <span>→</span></button>
            <div className="booking-note"><CheckCircle2 size={13}/> ჯავშანი იგზავნება რესტორანში დასადასტურებლად</div>
          </aside>
        </section>

        <section className="restaurant-body shell">
          <div className="restaurant-content">
            <div className="detail-tabs"><a href="#overview" className="active">მიმოხილვა</a><a href="#menu">მენიუ</a><a href="#photos">ფოტოები</a><a href="#reviews">მიმოხილვები</a><a href="#location">ლოკაცია</a></div>
            <article id="overview" className="detail-section"><div className="section-title-small">ჩვენს შესახებ</div><p>{restaurant.description || "რესტორნის აღწერა მალე დაემატება."}</p><div className="feature-facts"><span><MapPin size={15}/> {restaurant.district || restaurant.city}</span><span><Clock3 size={15}/> სამუშაო საათები იხილე სტუმრობისთვის</span></div></article>
            {events.length ? <article className="detail-section"><div className="section-title-small">მომავალი ივენთები</div><div className="event-row">{events.map(ev => <div key={ev.id} className="event-card"><span>{ev.emoji || "✦"}</span><div><strong>{ev.title}</strong>{ev.description ? <p>{ev.description}</p> : null}{ev.eventDate ? <small>{ev.eventDate}</small> : null}</div></div>)}</div></article> : null}
            <article id="menu" className="detail-section"><div className="section-title-small">მენიუ</div>{menu.length ? <div className="menu-list">{menu.map(cat => <div key={cat.id} className="menu-category"><h3>{cat.name}</h3>{cat.items.map(item => <div key={item.id} className={"menu-item " + (item.isAvailable ? "" : "muted")}><div>{item.photoUrl ? <img src={item.photoUrl} alt="" /> : null}<div><strong>{item.name}</strong>{item.description ? <p>{item.description}</p> : null}</div></div><span>₾{Number(item.price).toFixed(0)}</span></div>)}</div>)}</div> : <p className="muted-copy">მენიუ ჯერ არ არის დამატებული.</p>}</article>
            <article id="reviews" className="detail-section"><div className="section-title-small">მიმოხილვები <span>{restaurant.reviewsCount}</span></div>{reviews.length ? <div className="reviews-list">{reviews.slice(0,6).map(rv => <div key={rv.id} className="review-row"><div className="review-avatar">{(rv.reviewerName || rv.user?.name || "S").slice(0,1)}</div><div><div className="review-head"><strong>{rv.reviewerName || rv.user?.name || "სტუმარი"}</strong><span><Star size={11} fill="currentColor"/> {rv.rating}</span></div><p>{rv.comment || ""}</p></div></div>)}</div> : <p className="muted-copy">ჯერ არ არის გამოქვეყნებული მიმოხილვები.</p>}</article>
            <article id="photos" className="detail-section"><div className="section-title-small">ფოტოები</div><div className="detail-photo-grid">{photos.map(p => <img key={p.id} src={p.url} alt={restaurant.name} />)}</div></article>
            <article id="location" className="detail-section"><div className="section-title-small">ლოკაცია</div><div className="location-card"><div><MapPin size={18}/><strong>{restaurant.address}</strong><span>{restaurant.city}{restaurant.district ? " · " + restaurant.district : ""}</span></div><a href={"https://www.google.com/maps/search/?api=1&query="+restaurant.latitude+","+restaurant.longitude} target="_blank" rel="noreferrer">Google Maps →</a></div></article>
          </div>
        </section>
      </main>

      {bookingState==="login" ? <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setBookingState("idle")}}><div className="auth-modal"><button className="modal-close" onClick={() => setBookingState("idle")}>×</button><span className="kicker">დაჯავშნის გაგრძელება</span><h2>შედი შენს Skup ანგარიშში</h2><p>ჯავშნის გასაგზავნად საჭიროა ავტორიზაცია.</p><input value={loginIdentifier} onChange={e=>setLoginIdentifier(e.target.value)} placeholder="ელფოსტა ან ტელეფონი"/><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} type="password" placeholder="პაროლი"/>{loginError ? <div className="inline-error">{loginError}</div> : null}<button className="booking-submit" onClick={submitLogin}>შესვლა და დაჯავშნა <span>→</span></button></div></div> : null}
      {bookingState==="success" ? <div className="modal-backdrop"><div className="auth-modal success-modal"><div className="success-icon"><CheckCircle2 size={27}/></div><span className="kicker">ჯავშნის მოთხოვნა გაიგზავნა</span><h2>მადლობა!</h2><p>{restaurant.name} · {date} · {time} · {guests} სტუმარი</p><div className="success-note">რესტორანი მიიღებს მოთხოვნას და დადასტურებისთანავე გამოჩნდება შენს ჯავშნებში.</div><Link href="/account/" className="booking-submit">ჩემი ჯავშნები <span>→</span></Link><button className="modal-alt-link" onClick={() => setBookingState("idle")}>დარჩი აქ</button></div></div> : null}
      {bookingState==="error" ? <div className="modal-backdrop"><div className="auth-modal"><button className="modal-close" onClick={() => setBookingState("idle")}>×</button><span className="kicker">დაჯავშნა</span><h2>ვერ გავაგზავნეთ</h2><p>ცადე კიდევ ერთხელ.</p><button className="booking-submit" onClick={() => setBookingState("idle")}>კარგი</button></div></div> : null}
    </div>
  );
}
