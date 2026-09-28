"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getChatMessages } from "@/lib/skupApi";
import SkupHeader from "./SkupHeader";

type ChatMessage={id:string;bookingId:string;senderId:string;senderRole:string;content:string;createdAt:string};

export default function SkupChat(){
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [sending,setSending]=useState(false);
  const [userId,setUserId]=useState("");
  const [authToken,setAuthToken]=useState<string|null>(null);
  const [restaurant,setRestaurant]=useState("Restaurant");
  const listRef=useRef<HTMLDivElement>(null);
  const bookingId=typeof window!=="undefined" ? new URLSearchParams(window.location.search).get("booking_id") || "" : "";

  useEffect(()=>{
    if(typeof window!=="undefined"){
      const syncAuth=()=>{
        const nextToken=localStorage.getItem("skup_access_token");
        setAuthToken(nextToken);
        if(!nextToken) setMessages([]);
        try{ setUserId(String(JSON.parse(localStorage.getItem("skup_user")||"{}")?.id||"")); }catch{ setUserId(""); }
      };
      syncAuth();
      window.addEventListener("skup-auth-changed",syncAuth);
      setRestaurant(new URLSearchParams(window.location.search).get("restaurant") || "Restaurant");
      return()=>window.removeEventListener("skup-auth-changed",syncAuth);
    }
  },[]);

  useEffect(()=>{
    if(!authToken || !bookingId){setLoading(false);return;}
    setLoading(true);
    getChatMessages(authToken,bookingId).then(setMessages).catch(e=>setError(e instanceof Error?e.message:"Could not load chat.")).finally(()=>setLoading(false));
  },[bookingId,authToken]);

  useEffect(()=>{
    const el=listRef.current; if(el) el.scrollTop=el.scrollHeight;
  },[messages]);

  useEffect(()=>{
    if(!bookingId || !userId) return;
    let socket:any;
    (async()=>{
      try{
        const mod=await import("socket.io-client");
        socket=mod.io("https://api.skup.ge/chat",{transports:["websocket"],path:"/socket.io"});
        socket.emit("joinBookingRoom",bookingId);
        socket.on("newMessage",(msg:ChatMessage)=>setMessages(prev=>prev.some(x=>x.id===msg.id)?prev:[...prev,msg]));
      }catch{}
    })();
    return()=>{if(socket)socket.disconnect();};
  },[bookingId,userId]);

  const send=async()=>{
    const body=text.trim();
    if(!body || !bookingId || !userId || !authToken) return;
    setSending(true);
    try{
      const mod=await import("socket.io-client");
      const socket=mod.io("https://api.skup.ge/chat",{transports:["websocket"],path:"/socket.io"});
      socket.emit("joinBookingRoom",bookingId);
      await new Promise<void>(resolve=>{
        socket.emit("sendMessage",{bookingId,senderId:userId,senderRole:String(JSON.parse(localStorage.getItem("skup_user")||"{}")?.role||"user"),content:body});
        setTimeout(()=>{socket.disconnect();resolve();},350);
      });
      setText("");
      const token=localStorage.getItem("skup_access_token");
      if(token) setMessages(await getChatMessages(token,bookingId));
    }catch(e){setError(e instanceof Error?e.message:"Could not send message.");}
    finally{setSending(false);}
  };

  if(!bookingId) return <div className="skup-site"><SkupHeader/><main className="shell page-loading"><h2>Choose a booking first</h2><Link href="/bookings/">Back to bookings</Link></main></div>;

  return <div className="skup-site"><SkupHeader/><main className="shell chat-page">
    <div className="chat-head"><Link href="/bookings/" className="back-link"><ArrowLeft size={15}/> Back</Link><div><span className="kicker">BOOKING CHAT</span><h1>{restaurant}</h1><p>Message the restaurant about your reservation.</p></div></div>
    <div className="chat-shell">
      <div className="chat-messages" ref={listRef}>{loading?<div className="page-loading">Loading conversation…</div>:messages.length?messages.map(m=>{const me=m.senderId===userId;return <div key={m.id} className={"chat-row "+(me?"me":"")}><div className={"chat-bubble "+(me?"me":"")}><small>{!me && (m.senderRole==="restaurant_manager"?"Restaurant":"LUKMA guest")}</small><p>{m.content}</p><time>{new Date(m.createdAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</time></div></div>}):<div className="chat-empty"><MessageCircle size={34}/><h3>No messages yet</h3><p>Ask the restaurant about your reservation, arrival time or a special request.</p></div>}</div>
      <div className="chat-input"><textarea value={text} onChange={e=>setText(e.target.value.slice(0,500))} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}} placeholder="Write a message…"/><button className="green-btn" onClick={send} disabled={sending||!text.trim()}><Send size={15}/> {sending?"Sending…":"Send"}</button></div>
    </div>
    {error?<div className="inline-error">{error}</div>:null}
  </main></div>;
}
