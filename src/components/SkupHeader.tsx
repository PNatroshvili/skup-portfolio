"use client";

import Link from "next/link";
import { Heart, LogIn, Map, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export default function SkupHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="skup-header">
      <div className="skup-header-inner">
        <Link href="/" className="skup-logo">LUKMA<span>.</span></Link>
        <nav className="skup-nav">
          <Link href="/discover/">Discover</Link>
          <Link href="/discover/#map">Map</Link>
          <Link href="/discover/?is_open=true">Tonight</Link>
          <Link href="/discover/#collections">Collections</Link>
          <Link href="/journal/">Journal</Link>
        </nav>
        <div className="skup-header-actions">
          <Link className="header-icon" href="/account/" aria-label="My LUKMA"><Heart size={18} /></Link>
          <Link className="header-restaurant-link" href="/for-restaurants/">For Restaurants</Link>
          <Link className="header-login" href="/account/"><LogIn size={15} /> Log in</Link>
          <Link className="header-signup" href="/account/?mode=register">Create account</Link>
          <button className="header-menu" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="skup-mobile-nav">
          <Link href="/discover/" onClick={() => setOpen(false)}><Search size={17}/> Discover</Link>
          <Link href="/discover/#map" onClick={() => setOpen(false)}><Map size={17}/> Map</Link>
          <Link href="/account/" onClick={() => setOpen(false)}><Heart size={17}/> My LUKMA</Link>
          <Link href="/for-restaurants/" onClick={() => setOpen(false)}>For Restaurants</Link>
        </div>
      ) : null}
    </header>
  );
}
