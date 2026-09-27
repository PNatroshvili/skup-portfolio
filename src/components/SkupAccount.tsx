"use client";

import Link from "next/link";
import { CalendarDays, Heart, LogIn, LogOut, Star, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavorites, getLoyalty, getMe, getMyBookings, login } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

export default function SkupAccount() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("skup_access_token");
    setToken(t);
    if (!t) return;
    Promise.all([getMe(t), getMyBookings(t), getFavorites(t), getLoyalty(t)])
      .then(([u,b,f,l]) => { setUser(u); setBookings(b || []); setFavorites(f || []); setLoyalty(l); })
      .catch(() => { localStorage.removeItem("skup_access_token"); setToken(null); });
  }, []);

  async function doLogin() {
    setError("");
    try {
      const result = await login(identifier, password);
      localStorage.setItem("skup_access_token", result.tokens.access_token);
      localStorage.setItem("skup_refresh_token", result.tokens.refresh_token);
      localStorage.setItem("skup_user", JSON.stringify(result.user));
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "შესვლა ვერ მოხერხდა");
    }
  }

  function logout() {
    localStorage.removeItem("skup_access_token");
    localStorage.removeItem("skup_refresh_token");
    localStorage.removeItem("skup_user");
    setToken(null);
    setUser(null);
  }

  if (!token) return (
    <div className="skup-site">
      <SkupHeader />
      <main className="account-page shell">
        <div className="account-login-card">
          <div className="account-mark">S</div>
          <span className="kicker">MY SKUP</span>
          <h1>შენი მაგიდები,<br/>ფავორიტები და ჯილდოები.</h1>
          <p>შედი არსებულ Skup ანგარიშში, რომ ნახო ჯავშნები, ფავორიტები და loyalty.</p>
          <div className="account-login-form">
            <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="ელფოსტა ან ტელეფონი" />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="პაროლი" />
            {error ? <div className="inline-error">{error}</div> : null}
            <button className="green-btn" onClick={doLogin}><LogIn size={16}/> შესვლა</button>
          </div>
          <Link href="/discover/" className="account-secondary-link">ჯერ რესტორანი იპოვე →</Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="account-page shell">
        <div className="account-header"><div><span className="kicker">MY SKUP</span><h1>გამარჯობა, {user?.name || "სტუმარო"}.</h1><p>შენი Skup ერთ სივრცეში.</p></div><button className="outline-btn" onClick={logout}><LogOut size={15}/> გასვლა</button></div>
        <div className="account-grid">
          <aside className="account-side">
            <div className="account-user"><div className="avatar">{(user?.name || "S").slice(0,1)}</div><div><strong>{user?.name || "Skup user"}</strong><span>{user?.email || user?.phone || ""}</span></div></div>
            <nav><a className="active" href="#reservations"><CalendarDays size={16}/> ჯავშნები</a><a href="#favorites"><Heart size={16}/> ფავორიტები</a><a href="#loyalty"><Star size={16}/> Loyalty</a><a href="#profile"><UserRound size={16}/> პროფილი</a></nav>
          </aside>
          <div className="account-main">
            <section id="reservations" className="account-section"><div className="section-head"><div><span className="kicker">BOOKINGS</span><h2>ჩემი ჯავშნები</h2></div><Link href="/discover/" className="green-btn small">+ ახალი ჯავშანი</Link></div>{bookings.length ? bookings.slice(0,8).map(b => <div key={b.id} className="booking-row"><div className="booking-date"><strong>{b.date}</strong><span>{b.time}</span></div><div><strong>{b.restaurant?.name || "რესტორანი"}</strong><span>{b.guestsCount || b.guests_count} სტუმარი</span></div><span className={"status status-"+b.status}>{b.status}</span></div>) : <div className="empty-state">ჯავშნები ჯერ არ გაქვს.</div>}</section>
            <section id="favorites" className="account-section"><div className="section-head"><div><span className="kicker">SAVED</span><h2>ფავორიტები</h2></div></div>{favorites.length ? <div className="favorite-list">{favorites.slice(0,6).map(r => <Link key={r.id} href={"/restaurant/?id="+encodeURIComponent(r.id)} className="mini-fav-card">{r.cover_photo ? <img src={r.cover_photo} alt="" /> : <div className="mini-fav-fallback"/>}<div><strong>{r.name}</strong><span><Star size={11} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)}</span></div></Link>)}</div> : <div className="empty-state">შენახული რესტორნები ჯერ არ გაქვს.</div>}</section>
            <section id="loyalty" className="account-section"><div className="section-head"><div><span className="kicker">REWARDS</span><h2>Skup Loyalty</h2></div></div><div className="loyalty-card"><div><span>ქულები</span><strong>{loyalty?.points ?? 0}</strong></div><div><span>დონე</span><strong>{loyalty?.tier || "Bronze"}</strong></div><div className="loyalty-progress"><div><span>{loyalty?.progress ?? 0}%</span><span>{loyalty?.nextTier ? "შემდეგი: "+loyalty.nextTier : "უმაღლესი დონე"}</span></div><div className="progress-bar"><i style={{width: Math.max(0,Math.min(100,loyalty?.progress||0))+"%"}}/></div></div></div></section>
            <section id="profile" className="account-section"><div className="section-head"><div><span className="kicker">PROFILE</span><h2>პროფილი</h2></div></div><div className="profile-summary"><div><span>სახელი</span><strong>{user?.name || "—"} {user?.lastName || ""}</strong></div><div><span>ელფოსტა</span><strong>{user?.email || "—"}</strong></div><div><span>ტელეფონი</span><strong>{user?.phone || "—"}</strong></div></div></section>
          </div>
        </div>
      </main>
    </div>
  );
}
