"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavorites, removeFavorite, type Restaurant } from "@/lib/skupApi";
import { restaurantPhoto } from "@/lib/lukmaUtils";
import SkupHeader from "./SkupHeader";

export default function SkupFavorites(){
  const [items,setItems]=useState<Restaurant[]>([]);
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState("");
  const token=typeof window!=="undefined"?localStorage.getItem("skup_access_token"):null;
  useEffect(()=>{if(!token){setLoading(false);return;}getFavorites(token).then(setItems).catch(()=>setNotice("Could not load favorites.")).finally(()=>setLoading(false));},[token]);
  const remove=async(id:string)=>{if(!token)return;try{await removeFavorite(token,id);setItems(prev=>prev.filter(r=>r.id!==id));}catch{setNotice("Could not remove this favorite.");}};
  return <div className="skup-site"><SkupHeader/><main className="shell account-page">
    <div className="account-header"><div><span className="kicker">SAVED PLACES</span><h1>My favorites</h1><p>Keep the restaurants you want to come back to.</p></div><Link href="/discover/" className="green-btn">Discover restaurants</Link></div>
    {!token?<div className="account-login-card"><div className="account-mark">L</div><span className="kicker">MY LUKMA</span><h1>Save a place<br/>for later.</h1><p>Log in to keep your favorite restaurants together.</p><Link href="/account/" className="green-btn">Log in</Link></div>:
      loading?<div className="page-loading">Loading favorites…</div>:
      items.length?<div className="favorite-large-grid">{items.map(r=><article key={r.id} className="favorite-large-card"><Link href={"/restaurant/?id="+encodeURIComponent(r.id)}><img src={restaurantPhoto(r)} alt="" /></Link><div><div className="favorite-large-top"><div><h2>{r.name}</h2><p>{r.cuisine?.name||"Restaurant"} · {r.district||r.city}</p></div><button onClick={()=>remove(r.id)} aria-label="Remove favorite"><Heart size={16} fill="currentColor"/></button></div><span className="favorite-large-rating"><Star size={12} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)} · {r.reviewsCount||0} reviews</span><Link href={"/restaurant/?id="+encodeURIComponent(r.id)} className="outline-btn small">View restaurant</Link></div></article>)}</div>:
      <div className="empty-state"><Heart size={30}/><h3>No saved restaurants yet</h3><p>Tap Save on any restaurant to keep it here.</p><Link href="/discover/" className="green-btn">Start exploring</Link></div>}
    {notice?<div className="inline-error">{notice}</div>:null}
  </main></div>;
}
