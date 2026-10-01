"use client";

import Link from "next/link";
import { Bell, Heart, LogIn, LogOut, Map, Menu, Shield, Search, Utensils, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/skupApi";

export default function SkupHeader({
  searchValue,
  onSearchChange,
  activeNav = "",
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  activeNav?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem("skup_access_token"));
    const refreshNotificationCount = async () => {
      const token = localStorage.getItem("skup_access_token");
      if (!token) { setNotificationCount(0); return; }
      try { const result = await getNotifications(token); setNotificationCount(result.unreadCount || 0); } catch { setNotificationCount(0); }
    };
    if (hasToken) {
      try {
        const user = JSON.parse(localStorage.getItem("skup_user") || "{}");
        setRole(String(user?.role || ""));
        setUserName(String(user?.name || user?.email || ""));
      } catch {
        setRole("");
        setUserName("");
      }
      refreshNotificationCount();
    } else setNotificationCount(0);
    setAuthenticated(hasToken);
    const sync = () => {
      const hasToken = Boolean(localStorage.getItem("skup_access_token"));
      if (!hasToken) {
        setRole("");
        setUserName("");
        setAuthenticated(false);
        setNotificationCount(0);
        return;
      }
      try {
        const user = JSON.parse(localStorage.getItem("skup_user") || "{}");
        setRole(String(user?.role || ""));
        setUserName(String(user?.name || user?.email || ""));
        setAuthenticated(true);
        refreshNotificationCount();
      } catch {
        setRole("");
        setUserName("");
        setAuthenticated(true);
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("skup-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("skup-auth-changed", sync);
    };
  }, []);
  return (
    <header className="skup-header">
      <div className="skup-header-inner">
        <Link href="/" className="skup-logo" aria-label="LUKMA home"><img src="/lukma-logo.svg" alt="LUKMA" /><span className="skup-logo-word">LUKMA</span></Link>
        <nav className="skup-nav">
          <Link className={activeNav === "discover" ? "active" : ""} href="/discover/">Discover</Link>
          <Link className={activeNav === "map" ? "active" : ""} href="/discover/#map">Map</Link>
          <Link className={activeNav === "tonight" ? "active" : ""} href="/discover/?is_open=true">Tonight</Link>
          <Link className={activeNav === "offers" ? "active" : ""} href="/discover/?offers=true">Offers</Link>
          <Link className={activeNav === "collections" ? "active" : ""} href="/discover/#collections">Collections</Link>
          <Link href="/journal/">Journal</Link>
        </nav>
        <div className="skup-header-actions">
          {onSearchChange ? <label className="header-search"><Search size={15}/><input value={searchValue || ""} onChange={e => onSearchChange(e.target.value)} placeholder="Search restaurants, cuisine…" aria-label="Search restaurants, cuisine" /></label> : null}
          <Link className="header-icon header-notification" href="/notifications/" aria-label="Notifications"><Bell size={17}/>{notificationCount > 0 ? <span className="header-notification-badge">{notificationCount > 9 ? "9+" : notificationCount}</span> : null}</Link><Link className="header-icon" href="/favorites/" aria-label="Favorites"><Heart size={18} /></Link>
          {role === "restaurant_manager" ? <Link className="header-restaurant-link" href="/for-restaurants/dashboard/"><Utensils size={14}/> Manager</Link> : null}
          {role === "admin" ? <Link className="header-restaurant-link" href="/admin/"><Shield size={14}/> Admin</Link> : null}
          {authenticated ? <>
            <Link className="header-user" href="/account/" title="My account"><span>{userName.slice(0,1).toUpperCase() || "L"}</span>{userName ? <b>{userName.split(" ")[0]}</b> : null}</Link>
            <Link className="header-bookings" href="/bookings/">Bookings</Link>
            <button className="header-logout" onClick={() => { localStorage.removeItem("skup_access_token"); localStorage.removeItem("skup_refresh_token"); localStorage.removeItem("skup_user"); setAuthenticated(false); setUserName(""); setRole(""); window.location.href="/"; }} aria-label="Log out"><LogOut size={15}/></button>
          </> : <>
            <Link className="header-login" href="/account/"><LogIn size={15} /> Log in</Link>
            <Link className="header-signup" href="/account/?mode=register">Create account</Link>
          </>}
          <button className="header-menu" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="skup-mobile-nav">
          <Link href="/discover/" onClick={() => setOpen(false)}><Search size={17}/> Discover</Link>
          <Link href="/discover/#map" onClick={() => setOpen(false)}><Map size={17}/> Map</Link>
          <Link href="/discover/?is_open=true" onClick={() => setOpen(false)}>Tonight</Link>
          <Link href="/discover/?offers=true" onClick={() => setOpen(false)}>Offers</Link>
          <Link href="/discover/#collections" onClick={() => setOpen(false)}>Collections</Link>
          <Link href="/journal/" onClick={() => setOpen(false)}>Journal</Link>
          <Link href="/bookings/" onClick={() => setOpen(false)}>My bookings</Link>
          <Link href="/favorites/" onClick={() => setOpen(false)}>Favorites</Link>
          <Link href="/rewards/" onClick={() => setOpen(false)}>Rewards</Link>
          <Link href="/notifications/" onClick={() => setOpen(false)}>Notifications</Link>
          <Link href="/referral/" onClick={() => setOpen(false)}>Referral</Link>
          <Link href="/account/" onClick={() => setOpen(false)}><Heart size={17}/> My LUKMA</Link>
          {role === "restaurant_manager" ? <Link href="/for-restaurants/dashboard/" onClick={() => setOpen(false)}>Restaurant portal</Link> : null}
          {role === "admin" ? <Link href="/admin/" onClick={() => setOpen(false)}>Admin control center</Link> : null}
          <Link href="/for-restaurants/" onClick={() => setOpen(false)}>For Restaurants</Link>
        </div>
      ) : null}
    </header>
  );
}
