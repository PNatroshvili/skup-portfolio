"use client";

import Link from "next/link";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getLoyalty } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

export default function SkupReferral(){
  const [code,setCode]=useState("");
  const [copied,setCopied]=useState(false);
  const [token,setToken]=useState<string|null>(null);
  useEffect(()=>{
    const sync=()=>setToken(localStorage.getItem("skup_access_token"));
    sync();
    window.addEventListener("skup-auth-changed",sync);
    return()=>window.removeEventListener("skup-auth-changed",sync);
  },[]);
  useEffect(()=>{
    if(!token){setCode("");return;}
    getLoyalty(token).then(v=>setCode(v?.referralCode||"")).catch(()=>setCode(""));
  },[token]);
  const link=typeof window!=="undefined" ? window.location.origin+"/account/?ref="+encodeURIComponent(code) : "";
  const copy=async()=>{
    if(!code || !navigator.clipboard) return;
    try{
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1500);
    }catch{}
  };
  const share=async()=>{
    try{
      if(navigator.share) await navigator.share({title:"Join me on LUKMA",text:"Discover restaurants and book tables with LUKMA.",url:link});
      else await copy();
    }catch{}
  };
  return <div className="skup-site"><SkupHeader/><main className="shell account-page"><div className="account-header"><div><span className="kicker">REFERRAL</span><h1>Invite friends<br/>to LUKMA.</h1><p>Share your LUKMA code and both sides get points when a new guest joins.</p></div></div>{!token?<div className="account-login-card"><div className="account-mark">L</div><span className="kicker">MY LUKMA</span><h1>Your referral code<br/>is waiting.</h1><p>Sign in to see and share it.</p><Link className="green-btn" href="/account/">Log in</Link></div>:<div className="referral-card"><div className="referral-hero"><Users size={34}/><h2>Give 500 · Get 500</h2><p>Every successful referral adds points to both accounts.</p></div><div className="referral-code-box"><span>Your code</span><strong>{code||"Loading…"}</strong><button onClick={copy} disabled={!code}>{copied?<><Check size={14}/> Copied</>:<><Copy size={14}/> Copy link</>}</button></div><button className="green-btn referral-share" onClick={share}><Share2 size={15}/> Share invitation</button><div className="referral-steps"><div><b>01</b><span>Send your code</span></div><div><b>02</b><span>Friend creates an account</span></div><div><b>03</b><span>Both earn points</span></div></div><div className="referral-note"><Gift size={15}/> Referral rewards are added automatically after a qualifying signup.</div></div>}</main></div>;
}
