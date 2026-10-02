"use client";

import Link from "next/link";
import { Clock3, Hourglass, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cancelWaitlist, getMyWaitlist, type WaitlistEntry } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

export default function SkupWaitlist() {
  const [items,setItems]=useState<WaitlistEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function load(){
    const token=localStorage.getItem("skup_access_token");
    if(!token){setLoading(false);return;}
    try{setItems(await getMyWaitlist(token));}catch(e){setError(e instanceof Error?e.message:"მოლოდინის სიის ჩატვირთვა ვერ მოხერხდა.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  async function remove(id:string){
    const token=localStorage.getItem("skup_access_token"); if(!token)return;
    try{await cancelWaitlist(token,id);setItems(prev=>prev.map(x=>x.id===id?{...x,status:"cancelled"}:x));}
    catch(e){setError(e instanceof Error?e.message:"მოთხოვნის გაუქმება ვერ მოხერხდა.");}
  }
  const token=typeof window!=="undefined"?localStorage.getItem("skup_access_token"):null;
  return <div className="skup-site"><SkupHeader/><main className="shell waitlist-page">
    <div className="account-header"><div><span className="kicker">LUKMA</span><h1>მოლოდინის სია</h1><p>რესტორნები, სადაც თავისუფალი ადგილის გამოჩენისას შეგატყობინებთ.</p></div><Link href="/discover/" className="outline-btn">რესტორნების ძებნა</Link></div>
    {!token?<div className="empty-state"><Hourglass size={28}/><h3>შესვლა საჭიროა</h3><p>მოლოდინის სიის სამართავად შედი ანგარიშში.</p><Link href="/account/?mode=login" className="green-btn small">შესვლა</Link></div>:loading?<div className="notification-skeletons">{[1,2,3].map(i=><div className="notification-skeleton" key={i}/>)}</div>:error?<div className="inline-error">{error}<button className="outline-btn small" onClick={load}>თავიდან</button></div>:items.length?<div className="waitlist-list">{items.map(item=><div className="waitlist-item" key={item.id}><span className="waitlist-icon"><Hourglass size={16}/></span><div><strong>{item.date}</strong><p>{item.timeFrom||"ნებისმიერი დრო"}{item.timeTo?" → "+item.timeTo:""} · {item.guestsCount} სტუმარი</p><small>{item.status}</small></div>{item.status==="waiting"||item.status==="notified"?<button className="outline-btn small" onClick={()=>remove(item.id)}><X size={13}/> გაუქმება</button>:null}</div>)}</div>:<div className="empty-state"><Hourglass size={28}/><h3>მოლოდინის სია ცარიელია</h3><p>როცა ყველა მაგიდა დაკავებულია, შეგიძლია კონკრეტულ რესტორანში დაელოდო თავისუფალ ადგილს.</p></div>}
  </main></div>;
}
