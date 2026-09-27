"use client";

import Link from "next/link";
import { Heart, LogIn, Map, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export default function SkupHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="skup-header">
      <div className="skup-header-inner">
        <Link href="/" className="skup-logo">ლუკმა<span>.</span></Link>
        <nav className="skup-nav">
          <Link href="/discover/">აღმოაჩინე</Link>
          <Link href="/discover/#map">რუკა</Link>
          <Link href="/discover/?is_open=true">დღეს</Link>
          <Link href="/discover/#collections">კოლექციები</Link>
          <Link href="/journal/">ჟურნალი</Link>
        </nav>
        <div className="skup-header-actions">
          <Link className="header-icon" href="/account/" aria-label="ჩემი LUKMA"><Heart size={18} /></Link>
          <Link className="header-restaurant-link" href="/for-restaurants/">რესტორნებისთვის</Link>
          <Link className="header-login" href="/account/"><LogIn size={15} /> შესვლა</Link>
          <Link className="header-signup" href="/account/?mode=register">შექმენი ანგარიში</Link>
          <button className="header-menu" onClick={() => setOpen(!open)} aria-label="მენიუ">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="skup-mobile-nav">
          <Link href="/discover/" onClick={() => setOpen(false)}><Search size={17}/> აღმოჩენა</Link>
          <Link href="/discover/#map" onClick={() => setOpen(false)}><Map size={17}/> რუკა</Link>
          <Link href="/account/" onClick={() => setOpen(false)}><Heart size={17}/> ჩემი LUKMA</Link>
          <Link href="/for-restaurants/" onClick={() => setOpen(false)}>რესტორნებისთვის</Link>
        </div>
      ) : null}
    </header>
  );
}
