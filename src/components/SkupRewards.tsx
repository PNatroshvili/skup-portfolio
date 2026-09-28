"use client";

import Link from "next/link";
import { CalendarDays, Gift, Heart, Lock, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getLoyalty } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

const tiers = [
  { name:"Bronze", min:0, max:999, emoji:"🥉" },
  { name:"Silver", min:1000, max:4999, emoji:"🥈" },
  { name:"Gold", min:5000, max:9999, emoji:"🏅" },
  { name:"Platinum", min:10000, max:Infinity, emoji:"💎" },
];
const rewards = [
  { points:200, label:"5% discount" },
  { points:500, label:"10% discount" },
  { points:1000, label:"Free cocktail" },
  { points:1500, label:"VIP table" },
];

export default function SkupRewards() {
  type Loyalty = Awaited<ReturnType<typeof getLoyalty>>;
  const [loyalty,setLoyalty]=useState<Loyalty|null>(null);
  const [token,setToken]=useState<string|null>(null);
  useEffect(()=>{
    const sync=()=>setToken(localStorage.getItem("skup_access_token"));
    sync();
    window.addEventListener("skup-auth-changed",sync);
    window.addEventListener("storage",sync);
    return()=>{
      window.removeEventListener("skup-auth-changed",sync);
      window.removeEventListener("storage",sync);
    };
  },[]);
  useEffect(()=>{
    if(!token)return;
    getLoyalty(token).then(setLoyalty).catch(()=>setLoyalty(null));
  },[token]);
  const points=Number(loyalty?.points||0);
  const current=tiers.find(t=>points>=t.min && points<=t.max)||tiers[0];
  const next=tiers[tiers.indexOf(current)+1];
  const progress=loyalty?.progress ?? (next ? Math.round(((points-current.min)/(next.min-current.min))*100) : 100);
  return <div className="skup-site"><SkupHeader/><main className="shell account-page">
    <div className="account-header"><div><span className="kicker">REWARDS</span><h1>LUKMA Rewards</h1><p>Earn points from bookings, reviews and referrals.</p></div><Link href="/referral/" className="outline-btn"><Users size={14}/> Invite a friend</Link></div>
    {!token ? <div className="account-login-card"><div className="account-mark">L</div><span className="kicker">MY LUKMA</span><h1>Your rewards<br/>start here.</h1><p>Log in to track points and unlock rewards.</p><Link className="green-btn" href="/account/">Log in</Link></div> :
    <div className="rewards-shell">
      <section className="reward-points-card"><div className="reward-tier">{current.emoji} <strong>{current.name}</strong></div><div className="reward-points">{points}</div><span>points</span>{next ? <><div className="reward-progress"><i style={{width:Math.max(0,Math.min(100,Number(progress)))+"%"}}/></div><p>{Math.max(0,next.min-points)} points to {next.name} {next.emoji}</p></> : <p>You reached the highest tier.</p>}</section>
      <section className="account-section"><div className="section-head"><div><span className="kicker">EARN</span><h2>How to earn</h2></div></div><div className="reward-earn-grid">
        <div><CalendarDays/><strong>Confirmed booking</strong><span>+100 points</span></div>
        <div><Star/><strong>Restaurant review</strong><span>Share your visit and earn points</span></div>
        <div><Users/><strong>Invite a friend</strong><span>+500 points each</span></div>
        <div><Heart/><strong>First booking</strong><span>Welcome bonus</span></div>
      </div></section>
      <section className="account-section"><div className="section-head"><div><span className="kicker">REDEEM</span><h2>Available rewards</h2></div></div><div className="reward-card-grid">{rewards.map(r=>{const unlocked=points>=r.points;return <div className={"reward-option "+(unlocked?"unlocked":"locked")} key={r.points}><Gift size={22}/><strong>{r.label}</strong><span>{r.points} pts</span>{!unlocked?<Lock size={13}/>:null}</div>})}</div></section>
      <section className="account-section"><div className="section-head"><div><span className="kicker">TIERS</span><h2>Your journey</h2></div></div><div className="tier-list">{tiers.map(t=><div className={current.name===t.name?"active":""} key={t.name}><span>{t.emoji}</span><strong>{t.name}</strong><small>{t.max===Infinity ? (t.min + "+ points") : (t.min + "–" + t.max + " points")}</small>{current.name===t.name?<em>Current</em>:null}</div>)}</div></section>
    </div>}
  </main></div>;
}
