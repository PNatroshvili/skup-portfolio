
"use client";

import Link from "next/link";
import { CalendarDays, Heart, LogIn, LogOut, RefreshCw, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  forgotPassword,
  getFavorites,
  getLoyalty,
  getMe,
  getMyBookings,
  login,
  refreshAccessToken,
  register,
  resendVerificationCode,
  resetPassword,
  updateBookingStatus,
  updateProfile,
  verifyEmail,
} from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";
type Booking = {
  id: string;
  date: string;
  time: string;
  guestsCount?: number;
  guests_count?: number;
  comment?: string | null;
  status: string;
  restaurant?: { id?: string; name?: string; cover_photo?: string };
};

function saveSession(result: { user: Record<string, unknown>; tokens: { access_token: string; refresh_token: string } }) {
  localStorage.setItem("skup_access_token", result.tokens.access_token);
  localStorage.setItem("skup_refresh_token", result.tokens.refresh_token);
  localStorage.setItem("skup_user", JSON.stringify(result.user));
}

function clearSession() {
  localStorage.removeItem("skup_access_token");
  localStorage.removeItem("skup_refresh_token");
  localStorage.removeItem("skup_user");
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "ელოდება დადასტურებას",
    confirmed: "დადასტურებული",
    cancelled: "გაუქმებული",
    rejected: "უარყოფილი",
  };
  return map[status] || status;
}

export default function SkupAccount() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const loadAccount = async (accessToken: string) => {
    const [u,b,f,l] = await Promise.all([getMe(accessToken), getMyBookings(accessToken), getFavorites(accessToken), getLoyalty(accessToken)]);
    setUser(u);
    setBookings((b || []) as Booking[]);
    setFavorites(f || []);
    setLoyalty(l);
    setName(u?.name || "");
    setLastName(u?.lastName || "");
    setPhone(u?.phone || "");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "register") setMode("register");
    const t = localStorage.getItem("skup_access_token");
    const rt = localStorage.getItem("skup_refresh_token");
    setToken(t);

    if (!t && rt) {
      refreshAccessToken(rt)
        .then(next => {
          localStorage.setItem("skup_access_token", next.access_token);
          localStorage.setItem("skup_refresh_token", next.refresh_token);
          setToken(next.access_token);
          return loadAccount(next.access_token);
        })
        .catch(() => clearSession());
    } else if (t) {
      loadAccount(t).catch(async () => {
        if (!rt) throw new Error("session");
        const next = await refreshAccessToken(rt);
        localStorage.setItem("skup_access_token", next.access_token);
        localStorage.setItem("skup_refresh_token", next.refresh_token);
        setToken(next.access_token);
        await loadAccount(next.access_token);
      }).catch(() => {
        clearSession();
        setToken(null);
      });
    }
  }, []);

  const handleLogin = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await login(identifier.trim(), password);
      saveSession(result);
      setToken(result.tokens.access_token);
      await loadAccount(result.tokens.access_token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "შესვლა ვერ მოხერხდა";
      if (msg.includes("EMAIL_NOT_VERIFIED")) {
        setAuthEmail(identifier.includes("@") ? identifier.trim() : "");
        setMode("verify");
        setNotice("ელფოსტაზე გამოგზავნე ახალი კოდი ანგარიშის დასადასტურებლად.");
        if (identifier.includes("@")) await resendVerificationCode(identifier.trim());
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await register({
        name: name.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: authEmail.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
      setAuthEmail(result.email);
      setCode("");
      setMode("verify");
      setNotice("დადასტურების კოდი გამოგზავნილია ელფოსტაზე.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "რეგისტრაცია ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await verifyEmail(authEmail.trim(), code.trim());
      saveSession(result);
      setToken(result.tokens.access_token);
      await loadAccount(result.tokens.access_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "კოდის დადასტურება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      await forgotPassword(authEmail.trim());
      setMode("reset");
      setNotice("თუ ეს ელფოსტა რეგისტრირებულია, კოდი გამოგზავნილია.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "მოთხოვნა ვერ შესრულდა");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      await resetPassword(authEmail.trim(), code.trim(), newPassword);
      setMode("login");
      setPassword("");
      setNewPassword("");
      setCode("");
      setNotice("პაროლი შეიცვალა. ახლა შეგიძლია შეხვიდე.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "პაროლის შეცვლა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true); setError("");
    try {
      await resendVerificationCode(authEmail.trim());
      setNotice("ახალი კოდი გამოგზავნილია.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "კოდის გამოგზავნა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!token) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await updateProfile(token, {
        name: name.trim() || undefined,
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      if (result?.requiresVerification) {
        setAuthEmail(result.email);
        setMode("verify");
        setNotice("ახალი ელფოსტა უნდა დაადასტურო.");
      } else {
        setUser(result);
        setEditingProfile(false);
        setNotice("პროფილი განახლდა.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "პროფილის განახლება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!token) return;
    setBusy(true); setError("");
    try {
      await updateBookingStatus(token, bookingId, "cancelled");
      await loadAccount(token);
      setNotice("ჯავშანი გაუქმდა.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ჯავშნის გაუქმება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const upcoming = useMemo(
    () => bookings.filter(b => b.status === "pending" || b.status === "confirmed").sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings],
  );

  if (!token) {
    return (
      <div className="skup-site">
        <SkupHeader />
        <main className="account-page shell">
          <div className="account-login-card">
            <div className="account-mark">ლ</div>
            <span className="kicker">MY LUKMA</span>

            {mode === "login" ? (
              <>
                <h1>შენი მაგიდები,<br/>ფავორიტები და ჯილდოები.</h1>
                <p>შედი LUKMA ანგარიშში, რომ ნახო ჯავშნები, ფავორიტები და loyalty.</p>
                <div className="account-login-form">
                  <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="ელფოსტა ან ტელეფონი" />
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="პაროლი" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleLogin} disabled={busy}><LogIn size={16}/> {busy ? "იტვირთება…" : "შესვლა"}</button>
                </div>
                <div className="account-auth-links"><button onClick={() => {setMode("register");setError("");setNotice("")}}>შექმენი ანგარიში</button><button onClick={() => {setMode("forgot");setError("");setNotice("")}}>დაგავიწყდა პაროლი?</button></div>
              </>
            ) : null}

            {mode === "register" ? (
              <>
                <h1>შექმენი<br/>LUKMA ანგარიში.</h1>
                <p>რამდენიმე წამი და შენი ჯავშნები ერთ სივრცეში იქნება.</p>
                <div className="account-login-form">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="სახელი" />
                  <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="გვარი" />
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ტელეფონი" />
                  <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} type="email" placeholder="ელფოსტა" />
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="პაროლი (მინ. 6)" />
                  <input value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase())} placeholder="Referral code (არასავალდებულო)" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  <button className="green-btn" onClick={handleRegister} disabled={busy}>{busy ? "იქმნება…" : "რეგისტრაცია"}</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>უკვე მაქვს ანგარიში</button></div>
              </>
            ) : null}

            {mode === "verify" ? (
              <>
                <h1>დაადასტურე<br/>ელფოსტა.</h1>
                <p>შეიყვანე 6-ნიშნა კოდი, რომელიც გამოგიგზავნეთ <strong>{authEmail}</strong>-ზე.</p>
                <div className="account-login-form">
                  <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" placeholder="123456" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleVerify} disabled={busy}>{busy ? "მოწმდება…" : "დადასტურება"}</button>
                </div>
                <div className="account-auth-links"><button onClick={handleResend} disabled={busy}>კოდის ხელახლა გამოგზავნა</button><button onClick={() => setMode("login")}>შესვლაზე დაბრუნება</button></div>
              </>
            ) : null}

            {mode === "forgot" ? (
              <>
                <h1>აღადგინე<br/>პაროლი.</h1>
                <p>შეიყვანე ანგარიშთან დაკავშირებული ელფოსტა.</p>
                <div className="account-login-form">
                  <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} type="email" placeholder="ელფოსტა" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleForgot} disabled={busy}>კოდის გაგზავნა</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>შესვლაზე დაბრუნება</button></div>
              </>
            ) : null}

            {mode === "reset" ? (
              <>
                <h1>დააყენე<br/>ახალი პაროლი.</h1>
                <p>შეიყვანე ელფოსტაზე მიღებული 6-ნიშნა კოდი.</p>
                <div className="account-login-form">
                  <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" placeholder="კოდი" />
                  <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" placeholder="ახალი პაროლი (მინ. 6)" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleReset} disabled={busy}>პაროლის შეცვლა</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>შესვლაზე დაბრუნება</button></div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="account-page shell">
        <div className="account-header">
          <div><span className="kicker">MY LUKMA</span><h1>გამარჯობა, {user?.name || "სტუმარო"}.</h1><p>შენი LUKMA ერთ სივრცეში.</p></div>
          <button className="outline-btn" onClick={() => { clearSession(); setToken(null); setUser(null); }}><LogOut size={15}/> გასვლა</button>
        </div>

        {error ? <div className="inline-error account-global-error">{error}</div> : null}
        {notice ? <div className="account-notice account-global-notice">{notice}</div> : null}

        <div className="account-grid">
          <aside className="account-side">
            <div className="account-user"><div className="avatar">{(user?.name || "ლ").slice(0,1)}</div><div><strong>{user?.name || "LUKMA user"}</strong><span>{user?.email || user?.phone || ""}</span></div></div>
            <nav><a className="active" href="#reservations"><CalendarDays size={16}/> ჯავშნები</a><a href="#favorites"><Heart size={16}/> ფავორიტები</a><a href="#loyalty"><Star size={16}/> Loyalty</a><a href="#profile"><UserRound size={16}/> პროფილი</a></nav>
          </aside>

          <div className="account-main">
            <section id="reservations" className="account-section">
              <div className="section-head"><div><span className="kicker">BOOKINGS</span><h2>ჩემი ჯავშნები</h2></div><Link href="/discover/" className="green-btn small">+ ახალი ჯავშანი</Link></div>
              {upcoming.length ? upcoming.map(b => (
                <div key={b.id} className="booking-row">
                  <div className="booking-date"><strong>{b.date}</strong><span>{b.time}</span></div>
                  <div><strong>{b.restaurant?.name || "რესტორანი"}</strong><span>{b.guestsCount || b.guests_count || 0} სტუმარი</span></div>
                  <span className={"status status-"+b.status}>{statusLabel(b.status)}</span>
                  {b.status !== "cancelled" ? <button className="booking-cancel" onClick={() => cancelBooking(b.id)} disabled={busy}>გაუქმება</button> : null}
                </div>
              )) : <div className="empty-state">ჯავშნები ჯერ არ გაქვს.</div>}
            </section>

            <section id="favorites" className="account-section">
              <div className="section-head"><div><span className="kicker">SAVED</span><h2>ფავორიტები</h2></div></div>
              {favorites.length ? <div className="favorite-list">{favorites.slice(0,8).map(r => <Link key={r.id} href={"/restaurant/?id="+encodeURIComponent(r.id)} className="mini-fav-card">{r.cover_photo ? <img src={r.cover_photo} alt="" /> : <div className="mini-fav-fallback"/>}<div><strong>{r.name}</strong><span><Star size={11} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)}</span></div></Link>)}</div> : <div className="empty-state">შენახული რესტორნები ჯერ არ გაქვს.</div>}
            </section>

            <section id="loyalty" className="account-section">
              <div className="section-head"><div><span className="kicker">REWARDS</span><h2>LUKMA Loyalty</h2></div></div>
              <div className="loyalty-card"><div><span>ქულები</span><strong>{loyalty?.points ?? 0}</strong></div><div><span>დონე</span><strong>{loyalty?.tier || "Bronze"}</strong></div><div className="loyalty-progress"><div><span>{loyalty?.progress ?? 0}%</span><span>{loyalty?.nextTier ? "შემდეგი: "+loyalty.nextTier : "უმაღლესი დონე"}</span></div><div className="progress-bar"><i style={{width: Math.max(0,Math.min(100,loyalty?.progress||0))+"%"}}/></div></div></div>
            </section>

            <section id="profile" className="account-section">
              <div className="section-head"><div><span className="kicker">PROFILE</span><h2>პროფილი</h2></div><button className="outline-btn" onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? "დახურვა" : "რედაქტირება"}</button></div>
              {editingProfile ? (
                <div className="profile-edit-grid">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="სახელი" />
                  <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="გვარი" />
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ტელეფონი" />
                  <input value={user?.email || ""} disabled aria-label="ელფოსტა" />
                  <button className="green-btn" onClick={saveProfile} disabled={busy}><RefreshCw size={14}/> შენახვა</button>
                </div>
              ) : (
                <div className="profile-summary"><div><span>სახელი</span><strong>{user?.name || "—"} {user?.lastName || ""}</strong></div><div><span>ელფოსტა</span><strong>{user?.email || "—"}</strong></div><div><span>ტელეფონი</span><strong>{user?.phone || "—"}</strong></div></div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
