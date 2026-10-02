
"use client";

import Link from "next/link";
import { CalendarDays, Check, ExternalLink, LogOut, Plus, RefreshCw, Save, Search, Store, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMenuCategory,
  addMenuItem,
  createOffer,
  createRestaurantEvent,
  deleteMenuCategory,
  deleteMenuItem,
  deleteOffer,
  deleteRestaurantEvent,
  deleteRestaurantPhoto,
  setCoverPhoto,
  uploadRestaurantPhoto,
  getMyRestaurant,
  getMyRestaurantBookings,
  getMyOffers,
  getMyRestaurantEvents,
  getManagerAnalytics,
  getRestaurantWaitlist,
  getRestaurantTables,
  createRestaurantTable,
  deleteRestaurantTable,
  updateWaitlistStatus,
  getReviews,
  replyToReview,
  type MenuCategory,
  type Restaurant,
  type RestaurantEvent,
  type RestaurantOffer,
  type Review,
  type WaitlistEntry,
  type RestaurantTable,
  updateBookingStatus,
  updateMenuItem,
  uploadMenuItemPhoto,
  updateRestaurantDiscount,
  updateRestaurantHours,
  updateRestaurantInfo,
} from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";
import { isBookingUpcoming } from "@/lib/lukmaUtils";

type ManagedRestaurant = Restaurant & {
  menuCategories?: MenuCategory[];
  workingHours?: Restaurant["workingHours"];
};

type ManagerBooking = {
  id: string;
  date: string;
  time: string;
  guestsCount?: number;
  guests_count?: number;
  status: string;
  comment?: string | null;
  user?: { name?: string; email?: string; phone?: string };
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function SkupManager() {
  const [token, setToken] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<ManagedRestaurant | null>(null);
  const [bookings, setBookings] = useState<ManagerBooking[]>([]);
  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [offers, setOffers] = useState<RestaurantOffer[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [managerReviews, setManagerReviews] = useState<Review[]>([]);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [analytics, setAnalytics] = useState<import('@/lib/skupApi').ManagerAnalytics | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tableForm, setTableForm] = useState({ name:"", capacity:"2", shape:"square" as RestaurantTable["shape"], zone:"" });
  const [tab, setTab] = useState<"overview"|"bookings"|"menu"|"hours"|"events"|"photos"|"offers"|"waitlist"|"tables"|"reviews">("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", description:"", address:"", district:"", phone:"" });
  const [discount, setDiscount] = useState("");
  const [hours, setHours] = useState<NonNullable<Restaurant["workingHours"]>>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItem, setNewItem] = useState({ name:"", description:"", price:"", available:true });
  const [eventForm, setEventForm] = useState({ title:"", description:"", emoji:"✦", eventDate:"" });
  const [offerForm, setOfferForm] = useState({ title:"", description:"", discountPercent:"", startDate:"", endDate:"", startTime:"", endTime:"", minimumGuests:"", maximumGuests:"" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const runQueueRef = useRef<Promise<void>>(Promise.resolve());
  const runBusyRef = useRef(false);

  const reload = async (t: string) => {
    const activeToken = typeof window !== "undefined" ? localStorage.getItem("skup_access_token") || t : t;
    const [restaurantResult, bookingsResult, eventsResult, offersResult, analyticsResult] = await Promise.allSettled([
      getMyRestaurant(activeToken),
      getMyRestaurantBookings(activeToken),
      getMyRestaurantEvents(activeToken),
      getMyOffers(activeToken),
      getManagerAnalytics(activeToken),
    ]);
    if (restaurantResult.status !== "fulfilled") throw restaurantResult.reason;
    const r = restaurantResult.value;
    const b = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
    const e = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const o = offersResult.status === "fulfilled" ? offersResult.value : [];
    const a = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
    if (bookingsResult.status !== "fulfilled") setError("Restaurant loaded, but bookings could not be refreshed.");
    if (eventsResult.status !== "fulfilled") setError(prev => prev || "Restaurant loaded, but events could not be refreshed.");
    if (offersResult.status !== "fulfilled") setError(prev => prev || "Restaurant loaded, but offers could not be refreshed.");
    if (analyticsResult.status !== "fulfilled") setError(prev => prev || "Restaurant loaded, but analytics could not be refreshed.");
    let waitlistRows: WaitlistEntry[] = [];
    try { if (r?.id) waitlistRows = await getRestaurantWaitlist(activeToken, r.id); } catch { setError(prev => prev || "Restaurant loaded, but waitlist could not be refreshed."); }
    let tableRows: RestaurantTable[] = [];
    try { if (r?.id) tableRows = await getRestaurantTables(activeToken, r.id); } catch { setError(prev => prev || "Restaurant loaded, but tables could not be refreshed."); }
    let reviewRows: Review[] = [];
    try { if (r?.id) { const reviewResult = await getReviews(r.id); reviewRows = reviewResult.data || []; } } catch { setError(prev => prev || "Restaurant loaded, but reviews could not be refreshed."); }
    setRestaurant(r);
    setBookings((b || []) as ManagerBooking[]);
    setEvents(e || []);
    setOffers(o || []);
    setWaitlist(waitlistRows || []);
    setTables(tableRows || []);
    setManagerReviews(reviewRows || []);
    setAnalytics(a);
    setForm({
      name: r?.name || "",
      description: r?.description || "",
      address: r?.address || "",
      district: r?.district || "",
      phone: r?.phone || "",
    });
    setDiscount(r?.discountPercent == null ? "" : String(r.discountPercent));
    setHours((r?.workingHours || []).slice().sort((a,b) => a.day - b.day));
  };

  useEffect(() => {
    const syncSession = () => setToken(localStorage.getItem("skup_access_token"));
    window.addEventListener("skup-auth-changed", syncSession);
    window.addEventListener("storage", syncSession);
    const t = localStorage.getItem("skup_access_token");
    if (!t) {
      setLoading(false);
      return () => {
        window.removeEventListener("skup-auth-changed", syncSession);
        window.removeEventListener("storage", syncSession);
      };
    }
    setToken(t);
    reload(t).catch(() => {
      setError("Could not load restaurant manager data.");
    }).finally(() => setLoading(false));
    return () => {
      window.removeEventListener("skup-auth-changed", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const pending = useMemo(() => bookings.filter(b => b.status === "pending"), [bookings]);
  const upcoming = useMemo(
    () => bookings.filter(b => (b.status === "pending" || b.status === "confirmed") && isBookingUpcoming(b.date, b.time)),
    [bookings],
  );

  const [bookingFilter, setBookingFilter] = useState<"all"|"pending"|"confirmed"|"rejected"|"cancelled">("pending");
  const [bookingSearch, setBookingSearch] = useState("");
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const bookingDateValue = (b: ManagerBooking) => {
    const [year, month, day] = b.date.split("-").map(Number);
    const [hour, minute] = (b.time || "00:00").split(":").map(Number);
    return Date.UTC(year || 0, (month || 1) - 1, day || 1, hour || 0, minute || 0);
  };
  const sortedBookings = useMemo(() => [...bookings].sort((a,b) => bookingDateValue(b) - bookingDateValue(a)), [bookings]);
  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    return sortedBookings.filter(b => {
      const matchesStatus = bookingFilter === "all" || b.status === bookingFilter;
      const haystack = [b.user?.name, b.user?.email, b.user?.phone, b.comment].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [sortedBookings, bookingFilter, bookingSearch]);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
  const todayBookings = useMemo(() => bookings.filter(b => b.date === today && ["pending","confirmed"].includes(b.status)), [bookings, today]);
  const confirmed = useMemo(() => bookings.filter(b => b.status === "confirmed"), [bookings]);
  const rejected = useMemo(() => bookings.filter(b => b.status === "rejected"), [bookings]);
  const cancelled = useMemo(() => bookings.filter(b => b.status === "cancelled"), [bookings]);

  const refreshData = async () => {
    if (!token || refreshing) return;
    setRefreshing(true); setError("");
    try {
      await reload(token);
      setMessage("Restaurant data refreshed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refresh restaurant data.");
    } finally {
      setRefreshing(false);
    }
  };

  const changeBookingStatus = async (bookingId: string, status: "confirmed"|"rejected"|"cancelled") => {
    if (!token || actionBookingId) return;
    setActionBookingId(bookingId); setError(""); setMessage("");
    try {
      await updateBookingStatus(token, bookingId, status);
      setMessage(status === "confirmed" ? "Booking confirmed." : status === "rejected" ? "Booking rejected." : "Booking cancelled.");
      await reload(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update booking.");
    } finally {
      setActionBookingId(null);
    }
  };

  const run = (fn: () => Promise<unknown>, success: string): Promise<boolean> => {
    if (runBusyRef.current) return Promise.resolve(false);
    runBusyRef.current = true;
    const execute = async (): Promise<boolean> => {
      setBusy(true); setError(""); setMessage("");
      try {
        await fn();
        setMessage(success);
        if (token) {
          try {
            await reload(token);
          } catch {
            setMessage(success + " Latest data could not be refreshed; use Refresh.");
          }
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Operation failed.");
        return false;
      } finally {
        setBusy(false);
        runBusyRef.current = false;
      }
    };
    const next = runQueueRef.current.then(execute, execute);
    runQueueRef.current = next.then(() => undefined, () => undefined);
    return next;
  };

  if (loading) return <div className="skup-site"><SkupHeader/><div className="page-loading">Loading...</div></div>;

  if (!token) {
    return (
      <div className="skup-site"><SkupHeader/><main className="manager-page shell">
        <div className="manager-login-card">
          <Store size={25}/>
          <span className="kicker">LUKMA FOR RESTAURANTS</span>
          <h1>Manage your restaurant.</h1>
          <p>Log in with the LUKMA account linked to your restaurant.</p>
          <Link href="/account/" className="green-btn">Log in →</Link>
        </div>
      </main></div>
    );
  }

  if (!restaurant) {
    return (
      <div className="skup-site"><SkupHeader/><main className="manager-page shell">
        <div className="manager-login-card">
          <Store size={25}/>
          <span className="kicker">LUKMA FOR RESTAURANTS</span>
          <h1>No restaurant is linked yet.</h1>
          <p>{error || "This account is not linked to a restaurant yet."}</p>
          <a href="mailto:hello@skup.ge?subject=LUKMA%20restaurant%20link" className="green-btn">Request help</a>
        </div>
      </main></div>
    );
  }

  const updateHour = (day: number, patch: Partial<NonNullable<Restaurant["workingHours"]>[number]>) => {
    setHours(prev => {
      const rows = prev.slice();
      const index = rows.findIndex(x => x.day === day);
      const base = index >= 0 ? rows[index] : { day, open:"10:00", close:"23:00", isClosed:false };
      const next = { ...base, ...patch };
      if (index >= 0) rows[index] = next; else rows.push(next);
      return rows.sort((a,b) => a.day - b.day);
    });
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    run(() => addMenuCategory(token, restaurant.id, newCategory.trim()), "Category added.").then(ok => { if (ok) setNewCategory(""); });
  };

  const addItem = () => {
    const categoryId = newItemCategory || restaurant.menuCategories?.[0]?.id || "";
    if (!categoryId || !newItem.name.trim() || Number(newItem.price) <= 0) {
      setError("Dish name, category, and price are required.");
      return;
    }
    run(
      () => addMenuItem(token, restaurant.id, categoryId, { name:newItem.name.trim(), description:newItem.description.trim() || undefined, price:Number(newItem.price), isAvailable:newItem.available }),
      "Dish added."
    ).then(ok => { if (ok) setNewItem({ name:"", description:"", price:"", available:true }); });
  };

  const uploadPhoto = async (file: File, isCover: boolean) => {
    setPhotoBusy(true); setError(""); setMessage("");
    try {
      await uploadRestaurantPhoto(token, restaurant.id, file, isCover);
      setMessage(isCover ? "Cover photo updated." : "Photo added.");
      await reload(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const sendReviewReply = (reviewId: string) => {
    if (!replyDraft.trim()) { setError("Reply cannot be empty."); return; }
    run(() => replyToReview(token, reviewId, replyDraft.trim()), "Review response sent.").then(ok => {
      if (ok) { setReplyReviewId(null); setReplyDraft(""); }
    });
  };

  const addTable = () => {
    const name = tableForm.name.trim();
    const capacity = Number(tableForm.capacity);
    if (!name || !Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
      setError("Table name and capacity are required.");
      return;
    }
    run(() => createRestaurantTable(token, restaurant.id, { name, capacity, shape: tableForm.shape, zone: tableForm.zone.trim() || null, isActive: true }), "Table created.").then(ok => {
      if (ok) setTableForm({ name:"", capacity:"2", shape:"square", zone:"" });
    });
  };

  const addOffer = () => {
    if (!offerForm.title.trim()) { setError("Offer title is required."); return; }
    run(
      () => createOffer(token, restaurant.id, {
        title: offerForm.title.trim(),
        description: offerForm.description.trim() || undefined,
        discountPercent: offerForm.discountPercent === "" ? null : Number(offerForm.discountPercent),
        startDate: offerForm.startDate || null,
        endDate: offerForm.endDate || null,
        startTime: offerForm.startTime || null,
        endTime: offerForm.endTime || null,
        minimumGuests: offerForm.minimumGuests === "" ? null : Number(offerForm.minimumGuests),
        maximumGuests: offerForm.maximumGuests === "" ? null : Number(offerForm.maximumGuests),
        isActive: true,
      }),
      "Offer created."
    ).then(ok => { if (ok) setOfferForm({ title:"", description:"", discountPercent:"", startDate:"", endDate:"", startTime:"", endTime:"", minimumGuests:"", maximumGuests:"" }); });
  };

  const addEvent = () => {
    if (!eventForm.title.trim()) return;
    run(
      () => createRestaurantEvent(token, restaurant.id, {
        title:eventForm.title.trim(),
        description:eventForm.description.trim() || undefined,
        emoji:eventForm.emoji || "✦",
        eventDate:eventForm.eventDate || undefined,
      }),
      "Event added."
    ).then(ok => { if (ok) setEventForm({ title:"", description:"", emoji:"✦", eventDate:"" }); });
  };

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="manager-page shell">
        <header className="manager-header">
          <div>
            <span className="kicker">LUKMA FOR RESTAURANTS</span>
            <h1>{restaurant.name}</h1>
            <p>{restaurant.address} · {pending.length} new requests</p>
          </div>
          <div className="manager-head-actions"><button className="outline-btn" onClick={refreshData} disabled={refreshing}><RefreshCw size={14} className={refreshing ? "spin" : ""}/> {refreshing ? "Refreshing" : "Refresh"}</button>
            <a href={"/restaurant/?id=" + encodeURIComponent(restaurant.id)} className="outline-btn"><ExternalLink size={14}/> View profile</a>
            <Link href="/for-restaurants/subscription/" className="outline-btn">Subscription</Link>
            <button className="outline-btn" onClick={() => { localStorage.removeItem("skup_access_token"); localStorage.removeItem("skup_refresh_token"); localStorage.removeItem("skup_user"); window.dispatchEvent(new Event("skup-auth-changed")); window.location.href="/account/"; }}><LogOut size={14}/> Log out</button>
          </div>
        </header>

        {error ? <div className="inline-error">{error}</div> : null}
        {message ? <div className="account-notice">{message}</div> : null}

        <nav className="manager-tabs">
          {[
            ["overview","Overview"],
            ["bookings","Bookings"],
            ["menu","Menu"],
            ["hours","Opening hours"],
            ["events","Events"],
            ["offers","Offers"],
            ["waitlist","Waitlist"],
            ["tables","Tables"],
            ["reviews","Reviews"],
            ["photos","Photos"],
          ].map(([key,label]) => <button key={key} className={tab===key ? "active" : ""} onClick={() => setTab(key as typeof tab)}>{label}</button>)}
        </nav>

        {tab === "overview" ? (
          <>
            {analytics ? <section className="manager-stat-grid analytics-stat-grid">
              <div><span>Today</span><strong>{analytics.todayBookings}</strong><small>Bookings</small></div>
              <div><span>Guests</span><strong>{analytics.guests}</strong><small>Total covers</small></div>
              <div><span>Confirmed</span><strong>{analytics.confirmedBookings}</strong><small>All time</small></div>
              <div><span>Cancellation</span><strong>{analytics.totalBookings ? Math.round((analytics.cancelledBookings / analytics.totalBookings) * 100) + "%" : "0%"}</strong><small>Booking rate</small></div>
              <div><span>Rating</span><strong>{analytics.ratingAvg.toFixed(1)}</strong><small>{analytics.reviewsCount} reviews</small></div>
            </section> : null}

            <section className="manager-stat-grid">
              <div><span>New requests</span><strong>{pending.length}</strong><small>Need a response</small></div>
              <div><span>Today</span><strong>{todayBookings.length}</strong><small>Pending or confirmed</small></div>
              <div><span>Confirmed</span><strong>{confirmed.length}</strong><small>All time</small></div>
              <div><span>Upcoming</span><strong>{upcoming.length}</strong><small>Pending + confirmed</small></div>
              <div><span>Offer</span><strong>{restaurant.discountPercent ? "-" + restaurant.discountPercent + "%" : "—"}</strong></div>
            </section>
            <section className="manager-panel">
              <div className="section-head"><div><span className="kicker">PROFILE</span><h2>Restaurant information</h2></div><button className="green-btn small" onClick={() => run(() => updateRestaurantInfo(token, restaurant.id, form), "Information updated.")}><Save size={14}/> Save</button></div>
              <div className="manager-form-grid">
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Restaurant name"/>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone"/>
                <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Address"/>
                <input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="District"/>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description"/>
              </div>
            </section>
            <section className="manager-panel">
              <div className="section-head"><div><span className="kicker">OFFER</span><h2>Offer</h2></div><button className="green-btn small" onClick={() => run(() => updateRestaurantDiscount(token, restaurant.id, discount === "" ? null : Math.max(0, Math.min(100, Number(discount)))), "Offer updated.")}><Save size={14}/> Save</button></div>
              <div className="discount-editor"><input value={discount} onChange={e=>setDiscount(e.target.value.replace(/\D/g,"").slice(0,3))} inputMode="numeric" placeholder="10"/><span>%</span><p>This will appear as an offer to customers.</p></div>
            </section>
          </>
        ) : null}

        {tab === "bookings" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">RESERVATIONS</span><h2>Booking management</h2><p className="manager-section-note">{pending.length} pending · {confirmed.length} confirmed · {rejected.length} rejected · {cancelled.length} cancelled</p></div></div>
            <div className="manager-booking-toolbar"><div className="manager-booking-filters">{(["pending","confirmed","all","rejected","cancelled"] as const).map(filter => <button key={filter} className={bookingFilter===filter ? "active" : ""} onClick={() => setBookingFilter(filter)}>{filter} <span>{filter==="all" ? bookings.length : bookings.filter(b=>b.status===filter).length}</span></button>)}</div><label className="manager-booking-search"><Search size={14}/><input value={bookingSearch} onChange={e=>setBookingSearch(e.target.value)} placeholder="Search guest"/></label></div>
            {filteredBookings.length ? filteredBookings.map(b => (
              <div className="manager-booking-row" key={b.id}>
                <div className="manager-booking-date"><strong>{b.date}</strong><span>{b.time}</span></div>
                <div><strong>{b.user?.name || "guest"}</strong><span>{b.guestsCount || b.guests_count || 0} guest · {b.user?.phone || b.user?.email || ""}</span>{b.comment ? <small>{b.comment}</small> : null}</div>
                <span className={"status status-"+b.status}>{b.status}</span>
                <div className="manager-booking-actions">
                  {b.status === "pending" ? <><button className="green-mini" disabled={!!actionBookingId} onClick={() => changeBookingStatus(b.id,"confirmed")}>{actionBookingId===b.id ? "Saving…" : "Confirm"}</button><button className="red-mini" disabled={!!actionBookingId} onClick={() => changeBookingStatus(b.id,"rejected")}>Reject</button></> : null}
                  {b.status === "confirmed" ? <button className="red-mini" disabled={!!actionBookingId} onClick={() => changeBookingStatus(b.id,"cancelled")}>{actionBookingId===b.id ? "Saving…" : "Cancel"}</button> : null}
                  <Link className="green-mini" href={"/chat/?booking_id="+encodeURIComponent(b.id)+"&restaurant="+encodeURIComponent(restaurant.name)}>Chat</Link>
                </div>
              </div>
            )) : <div className="empty-state">{bookings.length ? "No bookings match this filter." : "No bookings yet."}</div>}
          </section>
        ) : null}

        {tab === "menu" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">MENU</span><h2>Menu management</h2></div></div>
            <div className="manager-add-row"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="New category"/><button className="green-btn small" onClick={addCategory}><Plus size={14}/> Category</button></div>
            <div className="manager-menu-list">
              {(restaurant.menuCategories || []).map(cat => (
                <div className="manager-menu-category" key={cat.id}>
                  <div className="manager-category-head"><div><UtensilsCrossed size={15}/><strong>{cat.name}</strong></div><div className="manager-category-actions"><span>{cat.items?.length || 0} dish</span><button className="red-mini" onClick={() => run(() => deleteMenuCategory(token,restaurant.id,cat.id), "Category deleted.")}><Trash2 size={12}/></button></div></div>
                  {cat.items?.map(item => <div className="manager-menu-item" key={item.id}>
                    <div className="manager-menu-item-main">
                      {item.photoUrl ? <img src={item.photoUrl} alt="" className="manager-menu-item-photo"/> : <div className="manager-menu-item-photo placeholder">L</div>}
                      <div className="manager-menu-item-fields">
                        <input defaultValue={item.name} aria-label="Dish name" onBlur={e => { const value=e.currentTarget.value.trim(); if(value && value!==item.name) run(() => updateMenuItem(token,restaurant.id,item.id,{name:value}), "Dish updated."); }} />
                        <input defaultValue={Number(item.price).toFixed(0)} inputMode="decimal" aria-label="Dish price" onBlur={e => { const value=Number(e.currentTarget.value); if(value>0 && value!==Number(item.price)) run(() => updateMenuItem(token,restaurant.id,item.id,{price:value}), "Dish price updated."); }} />
                        <input defaultValue={item.description || ""} aria-label="Dish description" placeholder="Description" onBlur={e => { const value=e.currentTarget.value.trim(); if(value!==String(item.description||"")) run(() => updateMenuItem(token,restaurant.id,item.id,{description:value}), "Dish description updated."); }} />
                      </div>
                    </div>
                    <div className="manager-menu-actions">
                      <label className="menu-photo-mini">Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file=e.currentTarget.files?.[0]; if(file) run(() => uploadMenuItemPhoto(token,restaurant.id,item.id,file), "Dish photo updated."); e.currentTarget.value=""; }} /></label>
                      <label className="switch-line"><input type="checkbox" checked={item.isAvailable} onChange={e => run(() => updateMenuItem(token,restaurant.id,item.id,{isAvailable:e.target.checked}), e.target.checked ? "Dish is available." : "Dish is unavailable.")}/><span>Available</span></label>
                      <button className="red-mini" onClick={() => run(() => deleteMenuItem(token,restaurant.id,item.id), "Dish deleted.")}><Trash2 size={12}/></button>
                    </div>
                  </div>)}
                </div>
              ))}
            </div>
            <div className="manager-add-item">
              <span className="kicker">New dish</span>
              <select value={newItemCategory} onChange={e=>setNewItemCategory(e.target.value)}><option value="">Category</option>{(restaurant.menuCategories || []).map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
              <input value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})} placeholder="Dish name"/>
              <input value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value.replace(/[^0-9.]/g,"")})} placeholder="Price" inputMode="decimal"/>
              <input value={newItem.description} onChange={e=>setNewItem({...newItem,description:e.target.value})} placeholder="Description"/>
              <button className="green-btn small" onClick={addItem} disabled={busy}><Plus size={14}/> Add</button>
            </div>
          </section>
        ) : null}

        {tab === "hours" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">HOURS</span><h2>Opening hours</h2></div><button className="green-btn small" onClick={() => run(() => updateRestaurantHours(token,restaurant.id,hours), "Opening hours updated.")}><Save size={14}/> Save</button></div>
            <div className="manager-hours-list">
              {Array.from({length:7},(_,day) => {
                const h=hours.find(x=>x.day===day) || {day,open:"10:00",close:"23:00",isClosed:false};
                return <div className="manager-hour-row" key={day}><strong>{DAYS[day]}</strong><input type="time" value={h.open || "10:00"} disabled={h.isClosed} onChange={e=>updateHour(day,{open:e.target.value})}/><span>—</span><input type="time" value={h.close || "23:00"} disabled={h.isClosed} onChange={e=>updateHour(day,{close:e.target.value})}/><label><input type="checkbox" checked={!!h.isClosed} onChange={e=>updateHour(day,{isClosed:e.target.checked})}/> Closed</label></div>;
              })}
            </div>
          </section>
        ) : null}


        {tab === "photos" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">GALLERY</span><h2>Gallery management</h2></div></div>
            <div className="manager-photo-upload">
              <label className="photo-upload-button">+ Add photo
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file, false);
                  e.currentTarget.value = "";
                }} />
              </label>
              <label className="photo-upload-button">Change cover photo
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file, true);
                  e.currentTarget.value = "";
                }} />
              </label>
              <span className="photo-upload-note">JPG, PNG or WebP · Maximum size depends on the server limit.</span>
            </div>
            <div className="manager-photo-grid">
              {(restaurant.photos || []).map(photo => (
                <div className={"manager-photo-card " + (photo.isCover ? "cover" : "")} key={photo.id}>
                  <img src={photo.url} alt="" loading="lazy" />
                  <div className="manager-photo-actions">
                    {photo.isCover ? <span className="photo-cover-label">Cover</span> : <button className="green-mini" onClick={() => run(() => setCoverPhoto(token,restaurant.id,photo.id), "Cover photo changed.")}>Set as cover</button>}
                    <button className="red-mini" onClick={() => run(() => deleteRestaurantPhoto(token,restaurant.id,photo.id), "Photo deleted.")}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
              {!restaurant.photos?.length ? <div className="empty-state">No photos have been added yet.</div> : null}
            </div>
          </section>
        ) : null}

        {tab === "reviews" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">REVIEWS</span><h2>Customer reviews</h2><p className="manager-section-note">Reply directly to guests from the restaurant manager.</p></div></div>
            {managerReviews.length ? <div className="manager-review-list">{managerReviews.slice(0,30).map(review => <div className="manager-review-row" key={review.id}>
              <div className="manager-review-head"><strong>{review.user?.name || "Guest"}</strong><span>★ {Number(review.rating || 0).toFixed(1)} · {new Date(review.createdAt).toLocaleDateString("ka-GE")}</span></div>
              {review.comment ? <p>{review.comment}</p> : <small>No comment.</small>}
              {review.restaurantReply ? <div className="manager-existing-reply"><strong>Your response</strong><p>{review.restaurantReply}</p></div> : null}
              {replyReviewId === review.id ? <div className="manager-reply-editor"><textarea value={replyDraft} maxLength={1000} onChange={e=>setReplyDraft(e.target.value)} placeholder="Write a helpful response…"/><div><button className="outline-btn small" onClick={()=>{setReplyReviewId(null);setReplyDraft("");}}>Cancel</button><button className="green-btn small" onClick={()=>sendReviewReply(review.id)} disabled={busy}>Reply</button></div></div> : <button className="outline-btn small" onClick={()=>{setReplyReviewId(review.id);setReplyDraft(review.restaurantReply || "");}}>Reply to review</button>}
            </div>)}</div> : <div className="empty-state"><h3>No reviews yet</h3><p>Verified customer reviews will appear here.</p></div>}
          </section>
        ) : null}

        {tab === "tables" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">FLOOR PLAN</span><h2>Tables & capacity</h2><p className="manager-section-note">Configure the tables used by LUKMA availability and booking allocation.</p></div></div>
            <div className="manager-form-grid table-manager-grid">
              <input value={tableForm.name} onChange={e=>setTableForm({...tableForm,name:e.target.value})} placeholder="Table name · e.g. T1"/>
              <input value={tableForm.capacity} onChange={e=>setTableForm({...tableForm,capacity:e.target.value.replace(/\D/g,"").slice(0,2)})} placeholder="Capacity" inputMode="numeric"/>
              <select value={tableForm.shape} onChange={e=>setTableForm({...tableForm,shape:e.target.value as RestaurantTable["shape"]})}><option value="square">Square</option><option value="round">Round</option><option value="rectangle">Rectangle</option></select>
              <input value={tableForm.zone} onChange={e=>setTableForm({...tableForm,zone:e.target.value})} placeholder="Zone · Terrace / Main hall"/>
              <button className="green-btn small" onClick={addTable}><Plus size={14}/> Add table</button>
            </div>
            {tables.length ? <div className="manager-table-grid">{tables.map(table => <div className={"manager-table-card "+(!table.isActive?"inactive":"")} key={table.id}>
              <div className="table-visual"><span>{table.name}</span><strong>{table.capacity}</strong></div><div><b>{table.name}</b><small>{table.capacity} seats{table.zone ? " · " + table.zone : ""}</small></div>
              <button className="red-mini" onClick={()=>run(()=>deleteRestaurantTable(token,table.id),"Table deleted.")}><Trash2 size={13}/></button>
            </div>)}</div> : <div className="empty-state"><h3>No tables configured</h3><p>Add tables to enable capacity-aware booking.</p></div>}
          </section>
        ) : null}

        {tab === "waitlist" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">WAITLIST</span><h2>Waiting guests</h2><p className="manager-section-note">Guests who asked to be notified when a table becomes available.</p></div></div>
            {waitlist.length ? waitlist.map(entry => <div className="manager-waitlist-row" key={entry.id}>
              <div><strong>{entry.date}</strong><span>{entry.timeFrom || "Any time"}{entry.timeTo ? " → " + entry.timeTo : ""}</span></div>
              <div><strong>{entry.guestsCount} guests</strong><span>{entry.status}</span></div>
              <select value={entry.status} onChange={e=>run(()=>updateWaitlistStatus(token,entry.id,e.target.value as "waiting"|"notified"|"booked"|"cancelled"|"expired"),"Waitlist updated.")}>
                <option value="waiting">waiting</option><option value="notified">notified</option><option value="booked">booked</option><option value="cancelled">cancelled</option><option value="expired">expired</option>
              </select>
            </div>) : <div className="empty-state"><h3>No guests waiting</h3><p>When a booking is unavailable, customers can join your waiting list.</p></div>}
          </section>
        ) : null}

        {tab === "offers" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">PROMOTIONS</span><h2>Restaurant offers</h2><p className="manager-section-note">Create time-bound offers that appear on customer restaurant pages.</p></div></div>
            <div className="manager-form-grid offer-manager-grid">
              <input value={offerForm.title} onChange={e=>setOfferForm({...offerForm,title:e.target.value})} placeholder="Offer title"/>
              <input value={offerForm.discountPercent} onChange={e=>setOfferForm({...offerForm,discountPercent:e.target.value.replace(/\D/g,"").slice(0,2)})} placeholder="Discount %" inputMode="numeric"/>
              <input value={offerForm.startDate} onChange={e=>setOfferForm({...offerForm,startDate:e.target.value})} type="date"/>
              <input value={offerForm.endDate} onChange={e=>setOfferForm({...offerForm,endDate:e.target.value})} type="date"/>
              <input value={offerForm.startTime} onChange={e=>setOfferForm({...offerForm,startTime:e.target.value})} type="time"/>
              <input value={offerForm.endTime} onChange={e=>setOfferForm({...offerForm,endTime:e.target.value})} type="time"/>
              <input value={offerForm.minimumGuests} onChange={e=>setOfferForm({...offerForm,minimumGuests:e.target.value.replace(/\D/g,"").slice(0,2)})} placeholder="Min guests"/>
              <input value={offerForm.maximumGuests} onChange={e=>setOfferForm({...offerForm,maximumGuests:e.target.value.replace(/\D/g,"").slice(0,2)})} placeholder="Max guests"/>
              <textarea value={offerForm.description} onChange={e=>setOfferForm({...offerForm,description:e.target.value})} placeholder="Offer description"/>
              <button className="green-btn small" onClick={addOffer}><Plus size={14}/> Create offer</button>
            </div>
            <div className="manager-offer-list">
              {offers.length ? offers.map(offer => <div className="manager-offer-row" key={offer.id}><div><strong>{offer.title}</strong><span>{offer.discountPercent ? "-"+offer.discountPercent+"%" : "Special offer"}{offer.startDate ? " · "+offer.startDate : ""}{offer.endDate ? " → "+offer.endDate : ""}</span>{offer.description ? <small>{offer.description}</small> : null}</div><span className={"status "+(offer.isActive ? "status-confirmed" : "status-cancelled")}>{offer.isActive ? "active" : "inactive"}</span><button className="red-mini" onClick={()=>run(()=>deleteOffer(token,offer.id),"Offer deleted.")}><Trash2 size={13}/></button></div>) : <div className="empty-state"><h3>No offers yet</h3><p>Create your first customer-facing promotion above.</p></div>}
            </div>
          </section>
        ) : null}

        {tab === "events" ? (
          <section className="manager-panel">
            <div className="section-head"><div><span className="kicker">EVENTS</span><h2>Events</h2></div></div>
            <div className="manager-add-event">
              <input value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})} placeholder="Event name"/>
              <input value={eventForm.emoji} onChange={e=>setEventForm({...eventForm,emoji:e.target.value})} placeholder="✦"/>
              <input value={eventForm.eventDate} onChange={e=>setEventForm({...eventForm,eventDate:e.target.value})} placeholder="2026-10-10 20:00"/>
              <textarea value={eventForm.description} onChange={e=>setEventForm({...eventForm,description:e.target.value})} placeholder="Description"/>
              <button className="green-btn small" onClick={addEvent}><Plus size={14}/> Add event</button>
            </div>
            <div className="manager-events-list">
              {events.map(ev => <div className="manager-event-row" key={ev.id}><span>{ev.emoji || "✦"}</span><div><strong>{ev.title}</strong><p>{ev.description || ""}</p><small>{ev.eventDate || ""}</small></div><button className="red-mini" onClick={() => run(() => deleteRestaurantEvent(token,ev.id), "Event deleted.")}><Trash2 size={13}/></button></div>)}
              {!events.length ? <div className="empty-state">No active events yet.</div> : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
