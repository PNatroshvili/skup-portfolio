"use client";

import Link from "next/link";
import { Bell, Check, ChefHat, Eye, LayoutDashboard, MessageSquare, RefreshCw, Trash2, Users, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteAdminCollection, deleteAdminRestaurant, deleteAdminReview, deleteAdminUser,
  getAdminBookings, getAdminBookingsChart, getAdminCollections, getAdminHomeSections,
  getAdminRestaurants, getAdminReviews, getAdminStats, getAdminTopRestaurants, getAdminUsers,
  sendAdminBroadcast, toggleAdminHomeSection, updateAdminCollection, updateAdminRestaurantStatus,
  updateAdminReviewStatus, updateAdminUserRole, updateAdminUserStatus, verifyAdminUserEmail,
} from "@/lib/skupApi";
import { restaurantPhoto } from "@/lib/lukmaUtils";
import SkupHeader from "./SkupHeader";

type Tab="overview"|"restaurants"|"bookings"|"users"|"reviews"|"content"|"broadcast";

function getToken(){ return typeof window!=="undefined" ? localStorage.getItem("skup_access_token") : null; }

export default function SkupAdmin(){
  const [tab,setTab]=useState<Tab>("overview");
  const [stats,setStats]=useState<any>(null);
  const [chart,setChart]=useState<any[]>([]);
  const [top,setTop]=useState<any[]>([]);
  const [restaurants,setRestaurants]=useState<any[]>([]);
  const [bookings,setBookings]=useState<any[]>([]);
  const [users,setUsers]=useState<any[]>([]);
  const [reviews,setReviews]=useState<any[]>([]);
  const [collections,setCollections]=useState<any[]>([]);
  const [sections,setSections]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(true);
  const [broadcastTitle,setBroadcastTitle]=useState("");
  const [broadcastBody,setBroadcastBody]=useState("");
  const [token,setToken]=useState<string|null>(null);
  const [actionBusy,setActionBusy]=useState(false);

  useEffect(()=>{
    const sync=()=>setToken(getToken());
    sync();
    window.addEventListener("skup-auth-changed",sync);
    window.addEventListener("storage",sync);
    return()=>{
      window.removeEventListener("skup-auth-changed",sync);
      window.removeEventListener("storage",sync);
    };
  },[]);

  const loadOverview=async()=>{if(!token)return;setLoading(true);try{const [s,c,t]=await Promise.all([getAdminStats(token),getAdminBookingsChart(token),getAdminTopRestaurants(token)]);setStats(s);setChart(c||[]);setTop(t||[]);}catch(e){setNotice(e instanceof Error?e.message:"Could not load admin dashboard.");}finally{setLoading(false);}};
  const loadTab=async(t:Tab)=>{if(!token)return;setLoading(true);setNotice("");try{
    if(t==="restaurants")setRestaurants((await getAdminRestaurants(token,{q:search,limit:50})).data||[]);
    if(t==="bookings")setBookings((await getAdminBookings(token,{limit:50})).data||[]);
    if(t==="users")setUsers((await getAdminUsers(token,{q:search,limit:50})).data||[]);
    if(t==="reviews")setReviews((await getAdminReviews(token,{limit:50})).data||[]);
    if(t==="content"){const [c,h]=await Promise.all([getAdminCollections(token),getAdminHomeSections(token)]);setCollections(c||[]);setSections(h||[]);}
  }catch(e){setNotice(e instanceof Error?e.message:"Could not load data.");}finally{setLoading(false);}};
  useEffect(()=>{loadOverview();},[token]);
  useEffect(()=>{if(tab!=="overview" && token)loadTab(tab);},[tab,token]);

  if(!token)return <div className="skup-site"><SkupHeader/><main className="shell account-page"><div className="account-login-card"><div className="account-mark">L</div><span className="kicker">ADMIN</span><h1>Open the admin<br/>control center.</h1><p>Use the admin demo account from My LUKMA.</p><Link className="green-btn" href="/account/">Open login</Link></div></main></div>;

  const doAction=async(fn:()=>Promise<any>, ok:string)=>{
    if(actionBusy || !token) return;
    setActionBusy(true); setNotice("");
    try{await fn();setNotice(ok);await loadTab(tab);}
    catch(e){setNotice(e instanceof Error?e.message:"Action failed.");}
    finally{setActionBusy(false);}
  };
  const maxChart=Math.max(1,...chart.map(x=>Number(x.count)||0));

  return <div className="skup-site"><SkupHeader/><main className="shell admin-page">
    <div className="admin-head"><div><span className="kicker">CONTROL CENTER</span><h1>LUKMA Admin</h1><p>Manage restaurants, guests, bookings, reviews and homepage content.</p></div><button className="outline-btn" onClick={()=>tab==="overview"?loadOverview():loadTab(tab)}><RefreshCw size={14}/> Refresh</button></div>
    {notice?<div className={notice.includes("failed")||notice.includes("Could not")?"inline-error":"account-notice"}>{notice}</div>:null}
    <div className="admin-tabs">{([
      ["overview","Overview",LayoutDashboard],["restaurants","Restaurants",Utensils],["bookings","Bookings",ChefHat],["users","Users",Users],["reviews","Reviews",MessageSquare],["content","Content",Eye],["broadcast","Broadcast",Bell]
    ] as const).map(([key,label,Icon])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}><Icon size={15}/>{label}</button>)}</div>

    {tab==="overview"?<section className="admin-content">
      <div className="admin-stat-grid">{[
        ["Restaurants",stats?.totalRestaurants??"—"],["Pending",stats?.pendingRestaurants??"—"],["Bookings",stats?.totalBookings??"—"],["Today",stats?.todayBookings??"—"],["Users",stats?.totalUsers??"—"],["Reviews",stats?.totalReviews??"—"],["Pending reviews",stats?.pendingReviews??"—"]
      ].map(([label,value])=><div className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="admin-two-col">
        <section className="admin-panel"><div className="section-head"><div><span className="kicker">30 DAYS</span><h2>Booking activity</h2></div></div><div className="admin-chart">{chart.map(x=><div className="admin-bar-wrap" key={x.date}><div className="admin-bar" style={{height:Math.max(4,(Number(x.count)/maxChart)*140)}}/><span>{String(x.date).slice(8,10)}</span></div>)}</div></section>
        <section className="admin-panel"><div className="section-head"><div><span className="kicker">TOP</span><h2>Most booked</h2></div></div><div className="admin-rank-list">{top.map((x,i)=><div key={x.name}><b>0{i+1}</b><span>{x.name}</span><strong>{x.bookings}</strong></div>)}{!top.length?<div className="empty-state">No booking data yet.</div>:null}</div></section>
      </div>
    </section>:null}

    {tab==="restaurants"?<section className="admin-content"><div className="admin-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search restaurants…"/><button className="green-btn small" onClick={()=>loadTab("restaurants")}>Search</button></div><div className="admin-table">{restaurants.map(r=><div className="admin-table-row admin-restaurant-row" key={r.id}><img src={restaurantPhoto(r)} alt="" /><div><strong>{r.name}</strong><span>{r.address}</span></div><span className={"status status-"+r.status}>{r.status}</span><select value={r.status} onChange={e=>doAction(()=>updateAdminRestaurantStatus(token,r.id,e.target.value),"Restaurant status updated.")}><option value="approved">approved</option><option value="pending">pending</option><option value="draft">draft</option><option value="rejected">rejected</option><option value="suspended">suspended</option></select><button className="red-mini" onClick={()=>doAction(()=>deleteAdminRestaurant(token,r.id),"Restaurant deleted.")}><Trash2 size={13}/></button></div>)}{!restaurants.length&&!loading?<div className="empty-state">No restaurants found.</div>:null}</div></section>:null}

    {tab==="bookings"?<section className="admin-content"><div className="admin-table">{bookings.map(b=><div className="admin-table-row" key={b.id}><div><strong>{b.restaurant?.name||"Restaurant"}</strong><span>{b.user?.name||b.user?.email||"Guest"}</span></div><span>{b.date} · {b.time}</span><span>{b.guestsCount||b.guests_count||0} guests</span><span className={"status status-"+b.status}>{b.status}</span><Link href={"/restaurant/?id="+encodeURIComponent(b.restaurant?.id||"")} className="outline-btn small">Open</Link></div>)}{!bookings.length&&!loading?<div className="empty-state">No bookings found.</div>:null}</div></section>:null}

    {tab==="users"?<section className="admin-content"><div className="admin-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…"/><button className="green-btn small" onClick={()=>loadTab("users")}>Search</button></div><div className="admin-table">{users.map(u=><div className="admin-table-row" key={u.id}><div><strong>{u.name||"Unnamed"}</strong><span>{u.email||u.phone||"—"}</span></div><select value={u.role} onChange={e=>doAction(()=>updateAdminUserRole(token,u.id,e.target.value),"User role updated.")}><option value="user">user</option><option value="restaurant_manager">restaurant_manager</option><option value="admin">admin</option></select><select value={u.status} onChange={e=>doAction(()=>updateAdminUserStatus(token,u.id,e.target.value as "active"|"blocked"),"User status updated.")}><option value="active">active</option><option value="blocked">blocked</option></select><button className="outline-btn small" onClick={()=>doAction(()=>verifyAdminUserEmail(token,u.id),"Email verified.")}><Check size={13}/> Verify</button><button className="red-mini" onClick={()=>doAction(()=>deleteAdminUser(token,u.id),"User deleted.")}><Trash2 size={13}/></button></div>)}{!users.length&&!loading?<div className="empty-state">No users found.</div>:null}</div></section>:null}

    {tab==="reviews"?<section className="admin-content"><div className="admin-table">{reviews.map(r=><div className="admin-table-row" key={r.id}><div><strong>{r.restaurant?.name||"Restaurant"}</strong><span>{r.user?.name||"Guest"} · {r.rating}/5</span></div><p>{r.comment||"No comment"}</p><span className={"status status-"+r.status}>{r.status}</span><select value={r.status === "pending" ? "approved" : r.status} onChange={e=>doAction(()=>updateAdminReviewStatus(token,r.id,e.target.value as "approved"|"hidden"),"Review updated.")}><option value="approved">approved</option><option value="hidden">hidden</option></select><button className="red-mini" onClick={()=>doAction(()=>deleteAdminReview(token,r.id),"Review deleted.")}><Trash2 size={13}/></button></div>)}{!reviews.length&&!loading?<div className="empty-state">No reviews found.</div>:null}</div></section>:null}

    {tab==="content"?<section className="admin-content"><div className="admin-two-col"><section className="admin-panel"><div className="section-head"><div><span className="kicker">HOME</span><h2>Homepage sections</h2></div></div><div className="admin-rank-list">{sections.map(s=><div key={s.sectionKey}><span>{s.sectionKey}</span><button className={"toggle-btn "+(s.isActive?"on":"")} onClick={()=>doAction(()=>toggleAdminHomeSection(token,s.sectionKey),"Homepage section updated.")}>{s.isActive?"Visible":"Hidden"}</button></div>)}</div></section><section className="admin-panel"><div className="section-head"><div><span className="kicker">COLLECTIONS</span><h2>Curated blocks</h2></div></div><div className="admin-rank-list">{collections.map(c=><div key={c.id}><span><b>{c.emoji}</b> {c.titleKa||c.title}</span><button className="red-mini" onClick={()=>doAction(()=>deleteAdminCollection(token,c.id),"Collection deleted.")}><Trash2 size={13}/></button></div>)}</div></section></div></section>:null}

    {tab==="broadcast"?<section className="admin-content"><section className="broadcast-card"><span className="kicker">PUSH NOTIFICATIONS</span><h2>Reach active guests</h2><p>Send a broadcast to users who have push tokens registered from the mobile app.</p><input value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)} placeholder="Notification title"/><textarea value={broadcastBody} onChange={e=>setBroadcastBody(e.target.value)} placeholder="Message"/><button className="green-btn" disabled={!broadcastTitle.trim()||!broadcastBody.trim()} onClick={()=>doAction(()=>sendAdminBroadcast(token,broadcastTitle.trim(),broadcastBody.trim()).then(()=>{setBroadcastTitle("");setBroadcastBody("");}),"Broadcast sent.")}><Bell size={15}/> Send to all active users</button></section></section>:null}
  </main></div>;
}
