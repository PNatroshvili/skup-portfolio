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
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
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
    if(!token){setCode("");return;}
    setLoading(true); setError("");
    getLoyalty(token).then(v=>setCode(v?.referralCode||"")).catch(e=>{setCode("");setError(e instanceof Error?e.message:"Could not load your referral code.");}).finally(()=>setLoading(false));
  },[token]);
  const link=typeof window!=="undefined" ? window.location.origin+"/account/?mode=register&ref="+encodeURIComponent(code) : "";
  const copy=async()=>{
    if(!code){setMessage("Your referral code is not available yet.");return;}
    if(!navigator.clipboard){setMessage("Copy is not available on this browser.");return;}
    try{
      await navigator.clipboard.writeText(link);
      setMessage("");
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1500);
    }catch{setMessage("Could not copy the invitation link.");}
  };
  const share=async()=>{
    if(!code){setMessage("Your referral code is not available yet.");return;}
    try{
      if(navigator.share){
        await navigator.share({title:"Join me on LUKMA",text:"Discover restaurants and book tables with LUKMA.",url:link});
      }else{
        await copy();
      }
    }catch(e){
      if(e instanceof DOMException && e.name==="AbortError") return;
      setMessage("Could not share the invitation.");
    }
  };
  return <div className="skup-site"><SkupHeader/><main className="shell account-page"><div className="account-header"><div><span className="kicker">REFERRAL</span><h1>Invite friends<br/>to LUKMA.</h1><p>Share your LUKMA code and both sides get points when a new guest joins.</p></div></div>{!token?<div className="account-login-card"><div className="account-mark">L</div><span className="kicker">MY LUKMA</span><h1>Your referral code<br/>is waiting.</h1><p>Sign in to see and share it.</p><Link className="green-btn" href="/account/">Log in</Link></div>:<div className="referral-card">{error ? <div className="inline-error">{error}</div> : null}<div className="referral-hero"><Users size={34}/><h2>Give 500 · Get 500</h2><p>Every successful referral adds points to both accounts.</p></div><div className="referral-code-box"><span>Your code</span><strong>{loading ? "Loading…" : code || "Unavailable"}</strong><button onClick={copy} disabled={!code}>{copied?<><Check size={14}/> Copied</>:<><Copy size={14}/> Copy link</>}</button></div>{message ? <div className="inline-error">{message}</div> : null}<button className="green-btn referral-share" onClick={share} disabled={!code}><Share2 size={15}/> Share invitation</button><div className="referral-steps"><div><b>01</b><span>Send your code</span></div><div><b>02</b><span>Friend creates an account</span></div><div><b>03</b><span>Both earn points</span></div></div><div className="referral-note"><Gift size={15}/> Referral rewards are added automatically after a qualifying signup.</div></div>}</main></div>;
}
