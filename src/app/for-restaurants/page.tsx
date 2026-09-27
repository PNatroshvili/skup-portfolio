import Link from "next/link";
import SkupHeader from "@/components/SkupHeader";

export default function ForRestaurants() {
  const items = [
    ["ჯავშნების მართვა", "მიიღე ახალი მოთხოვნები და მართე დადასტურებები ერთ სივრცეში."],
    ["მენიუ და ფოტოები", "განაახლე მენიუ, ფასები, availability და მთავარი ფოტოები."],
    ["შეთავაზებები და ივენთები", "მოიზიდე სტუმრები სპეციალური შეთავაზებებითა და ღონისძიებებით."],
    ["ანალიტიკა", "ნახე ჯავშნების დინამიკა და გაიგე როგორ იცვლება მოთხოვნა."],
  ];
  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="partner-page">
        <section className="partner-hero">
          <div className="shell">
            <span className="kicker">SKUP FOR RESTAURANTS</span>
            <h1>გაზარდე შენი<br/><em>რესტორანი</em> Skup-თან.</h1>
            <p>მიიღე ახალი სტუმრები, მართე ჯავშნები და აკონტროლე შენი რესტორნის ციფრული პროფილი ერთი პლატფორმიდან.</p>
            <div className="partner-actions"><Link href="/account/" className="green-btn">შესვლა</Link><a href="mailto:hello@skup.ge" className="outline-btn">დაგვიკავშირდი</a></div>
          </div>
        </section>
        <section className="section shell">
          <div className="section-head"><div><span className="kicker">ერთი სივრცე</span><h2>ყველაფერი, რაც მენეჯერს სჭირდება.</h2></div></div>
          <div className="partner-feature-grid">{items.map(([title,desc],i)=><div key={title} className="partner-feature"><span>0{i+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div>
        </section>
        <section className="section section-dark">
          <div className="shell partner-bottom"><div><span className="kicker">PARTNER WITH SKUP</span><h2>მზად ხარ<br/>დაგვემატო?</h2></div><a className="green-btn" href="mailto:hello@skup.ge?subject=Skup%20restaurant%20partner">დაწყება →</a></div>
        </section>
      </main>
    </div>
  );
}
