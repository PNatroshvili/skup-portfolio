"use client";

import Link from "next/link";
import { Check, CreditCard, Info } from "lucide-react";
import SkupHeader from "./SkupHeader";

const FEATURES=["Booking management","Manager dashboard","Analytics","Guest notifications","Restaurant profile","LUKMA support"];

export default function SkupSubscription(){
  return <div className="skup-site"><SkupHeader/><main className="shell subscription-page">
    <div className="account-header"><div><span className="kicker">FOR RESTAURANTS</span><h1>Stay visible on LUKMA.</h1><p>The subscription screen from the mobile manager is now part of the web portal too.</p></div><Link href="/for-restaurants/dashboard/" className="outline-btn">Back to portal</Link></div>
    <section className="subscription-card"><div className="subscription-status"><span>Current plan</span><strong>Standard</strong><em>Active demo</em></div><div className="subscription-price"><strong>49</strong><span>₾ / month</span></div><div className="subscription-divider"/><div className="subscription-features">{FEATURES.map(f=><div key={f}><Check size={14}/><span>{f}</span></div>)}</div><button className="green-btn" onClick={()=>window.location.href="mailto:hello@skup.ge?subject=LUKMA%20subscription"}><CreditCard size={15}/> Contact LUKMA to activate</button><div className="subscription-note"><Info size={14}/> Billing is not connected to a payment gateway yet; this mirrors the app's current contact-to-activate flow.</div></section>
  </main></div>;
}
