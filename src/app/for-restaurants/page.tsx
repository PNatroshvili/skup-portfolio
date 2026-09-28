
import Link from "next/link";
import SkupHeader from "@/components/SkupHeader";

export default function ForRestaurants() {
  const items = [
    ["Booking management", "Receive new requests and manage confirmations in one place."],
    ["Menu & photos", "Update your menu, prices, availability, and cover photos."],
    ["Offers & events", "Attract guests with special offers and events."],
    ["Analytics", "See booking trends and understand how demand changes."],
  ];

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="partner-page">
        <section className="partner-hero">
          <div className="shell">
            <span className="kicker">LUKMA FOR RESTAURANTS</span>
            <h1>Bring your restaurant<br/>to LUKMA.</h1>
            <p>Reach new guests, manage bookings, and control your restaurant digital profile from one platform.</p>
            <div className="partner-actions">
              <a href="/for-restaurants/dashboard/" className="green-btn">Restaurant portal →</a>
              <a href="mailto:hello@skup.ge?subject=LUKMA%20restaurant%20partner" className="outline-btn">Contact us</a>
            </div>
          </div>
        </section>
        <section className="section shell">
          <div className="section-head"><div><span className="kicker">One workspace</span><h2>The tools your team uses every day.</h2></div></div>
          <div className="partner-feature-grid">{items.map(([title,desc],i)=><div key={title} className="partner-feature"><span>0{i+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div>
        </section>
        <section className="section section-dark">
          <div className="shell partner-bottom">
            <div><span className="kicker">PARTNER WITH LUKMA</span><h2>Ready to join us?</h2></div>
            <a className="green-btn" href="mailto:hello@skup.ge?subject=LUKMA%20restaurant%20partner">Get started →</a>
          </div>
        </section>
      </main>
    </div>
  );
}
