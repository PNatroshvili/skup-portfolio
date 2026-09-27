
"use client";

import Link from "next/link";
import { CalendarDays, Heart, LogIn, LogOut, RefreshCw, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  forgotPassword,
  getFavorites,
  getRewards,
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
    pending: "Awaiting confirmation",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };
  return map[status] || status;
}

export default function SkupAccount() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loyalty, setRewards] = useState<any>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const loadAccount = async (accessToken: string) => {
    const [u,b,f,l] = await Promise.all([getMe(accessToken), getMyBookings(accessToken), getFavorites(accessToken), getRewards(accessToken)]);
    setUser(u);
    setBookings((b || []) as Booking[]);
    setFavorites(f || []);
    setRewards(l);
    setName(String(u?.name ?? ""));
    setLastName(String(u?.lastName ?? ""));
    setPhone(String(u?.phone ?? ""));
    setProfileEmail(String(u?.email ?? ""));
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
      const msg = e instanceof Error ? e.message : "Login failed";
      if (msg.includes("EMAIL_NOT_VERIFIED")) {
        setAuthEmail(identifier.includes("@") ? identifier.trim() : "");
        setMode("verify");
        setNotice("A new verification code has been sent to your email.");
        if (identifier.includes("@")) {
          try {
            await resendVerificationCode(identifier.trim());
          } catch {
            setError("Could not resend the code.");
          }
        }
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
      setNotice("A verification code has been sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the account");
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
      setError(e instanceof Error ? e.message : "Could not verify the code");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      await forgotPassword(authEmail.trim());
      setMode("reset");
      setNotice("If this email is registered, a code has been sent.");
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
      setNotice("Password changed. You can now log in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true); setError("");
    try {
      await resendVerificationCode(authEmail.trim());
      setNotice("A new code has been sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code");
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
        email: profileEmail.trim() || undefined,
      });
      if (result?.requiresVerification) {
        setAuthEmail(result.email);
        setMode("verify");
        setNotice("You need to verify the new email.");
      } else {
        setUser(result);
        setEditingProfile(false);
        setNotice("Profile updated.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the profile");
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
      setNotice("Booking cancelled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel the booking");
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
                <h1>Your tables,<br/>favorites and rewards.</h1>
                <p>Log in to manage your bookings, favorites, and rewards.</p>
                <div className="account-login-form">
                  <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Email or phone" />
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleLogin} disabled={busy}><LogIn size={16}/> {busy ? "Loading…" : "Log in"}</button>
                </div>
                <div className="account-auth-links"><button onClick={() => {setMode("register");setError("");setNotice("")}}>Create an account</button><button onClick={() => {setMode("forgot");setError("");setNotice("")}}>Forgot password?</button></div>
              </>
            ) : null}

            {mode === "register" ? (
              <>
                <h1>Create your<br/>LUKMA account.</h1>
                <p>Your bookings, favorites, and rewards in one place.</p>
                <div className="account-login-form">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
                  <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" />
                  <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} type="email" placeholder="Email" />
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (min. 6)" />
                  <input value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase())} placeholder="Referral code (optional)" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  <button className="green-btn" onClick={handleRegister} disabled={busy}>{busy ? "იქმნება…" : "Create account"}</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>I already have an account</button></div>
              </>
            ) : null}

            {mode === "verify" ? (
              <>
                <h1>Verify your<br/>Email.</h1>
                <p>Enter the 6-digit code we sent to <strong>{authEmail}</strong>.</p>
                <div className="account-login-form">
                  <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" placeholder="123456" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleVerify} disabled={busy}>{busy ? "Verifying…" : "Verify"}</button>
                </div>
                <div className="account-auth-links"><button onClick={handleResend} disabled={busy}>Resend code</button><button onClick={() => setMode("login")}>Back to login</button></div>
              </>
            ) : null}

            {mode === "forgot" ? (
              <>
                <h1>Reset your<br/>password.</h1>
                <p>Enter the email linked to your account.</p>
                <div className="account-login-form">
                  <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} type="email" placeholder="Email" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleForgot} disabled={busy}>Send code</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>Back to login</button></div>
              </>
            ) : null}

            {mode === "reset" ? (
              <>
                <h1>Set a<br/>new password.</h1>
                <p>Enter the 6-digit code sent to your email.</p>
                <div className="account-login-form">
                  <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" placeholder="Code" />
                  <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" placeholder="New password (min. 6)" />
                  {error ? <div className="inline-error">{error}</div> : null}
                  {notice ? <div className="account-notice">{notice}</div> : null}
                  <button className="green-btn" onClick={handleReset} disabled={busy}>Change password</button>
                </div>
                <div className="account-auth-links"><button onClick={() => setMode("login")}>Back to login</button></div>
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
          <div><span className="kicker">MY LUKMA</span><h1>Hello, {user?.name || "Guest"}.</h1><p>Your LUKMA in one place.</p></div>
          <button className="outline-btn" onClick={() => { clearSession(); setToken(null); setUser(null); }}><LogOut size={15}/> Log out</button>
        </div>

        {error ? <div className="inline-error account-global-error">{error}</div> : null}
        {notice ? <div className="account-notice account-global-notice">{notice}</div> : null}

        <div className="account-grid">
          <aside className="account-side">
            <div className="account-user"><div className="avatar">{(user?.name || "L").slice(0,1)}</div><div><strong>{user?.name || "LUKMA user"}</strong><span>{user?.email || user?.phone || ""}</span></div></div>
            <nav>
              <a className="active" href="#reservations"><CalendarDays size={16}/> Bookings</a>
              <a href="#favorites"><Heart size={16}/> Favorites</a>
              <a href="#loyalty"><Star size={16}/> Rewards</a>
              <a href="#profile"><UserRound size={16}/> Profile</a>
              {user?.role === "restaurant_manager" ? <a className="account-manager-link" href="/for-restaurants/dashboard/">Restaurant portal →</a> : null}
            </nav>
          </aside>

          <div className="account-main">
            <section id="reservations" className="account-section">
              <div className="section-head"><div><span className="kicker">BOOKINGS</span><h2>My bookings</h2></div><Link href="/discover/" className="green-btn small">+ New booking</Link></div>
              {upcoming.length ? upcoming.map(b => (
                <div key={b.id} className="booking-row">
                  <div className="booking-date"><strong>{b.date}</strong><span>{b.time}</span></div>
                  <div><strong>{b.restaurant?.name || "რესტორანი"}</strong><span>{b.guestsCount || b.guests_count || 0} guest(s)</span></div>
                  <span className={"status status-"+b.status}>{statusLabel(b.status)}</span>
                  {b.status !== "cancelled" ? <button className="booking-cancel" onClick={() => cancelBooking(b.id)} disabled={busy}>Cancel</button> : null}
                </div>
              )) : <div className="empty-state">You have no bookings yet.</div>}
            </section>

            <section id="favorites" className="account-section">
              <div className="section-head"><div><span className="kicker">SAVED</span><h2>Favorites</h2></div></div>
              {favorites.length ? <div className="favorite-list">{favorites.slice(0,8).map(r => <Link key={r.id} href={"/restaurant/?id="+encodeURIComponent(r.id)} className="mini-fav-card">{r.cover_photo ? <img src={r.cover_photo} alt="" /> : <div className="mini-fav-fallback"/>}<div><strong>{r.name}</strong><span><Star size={11} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)}</span></div></Link>)}</div> : <div className="empty-state">You have no saved restaurants yet.</div>}
            </section>

            <section id="loyalty" className="account-section">
              <div className="section-head"><div><span className="kicker">REWARDS</span><h2>LUKMA Rewards</h2></div></div>
              <div className="loyalty-card"><div><span>Points</span><strong>{loyalty?.points ?? 0}</strong></div><div><span>Tier</span><strong>{loyalty?.tier || "Bronze"}</strong></div><div className="loyalty-progress"><div><span>{loyalty?.progress ?? 0}%</span><span>{loyalty?.nextTier ? "Next: "+loyalty.nextTier : "Highest tier"}</span></div><div className="progress-bar"><i style={{width: Math.max(0,Math.min(100,loyalty?.progress||0))+"%"}}/></div></div></div>
            </section>

            <section id="profile" className="account-section">
              <div className="section-head"><div><span className="kicker">PROFILE</span><h2>Profile</h2></div><button className="outline-btn" onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? "Close" : "Edit"}</button></div>
              {editingProfile ? (
                <div className="profile-edit-grid">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
                  <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" />
                  <input value={profileEmail} onChange={e=>setProfileEmail(e.target.value)} type="email" placeholder="Email" />
                  <button className="green-btn" onClick={saveProfile} disabled={busy}><RefreshCw size={14}/> Save</button>
                </div>
              ) : (
                <div className="profile-summary"><div><span>Name</span><strong>{user?.name || "—"} {user?.lastName || ""}</strong></div><div><span>Email</span><strong>{user?.email || "—"}</strong></div><div><span>Phone</span><strong>{user?.phone || "—"}</strong></div></div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
