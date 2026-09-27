"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getCollections, getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

export default function SkupHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [collections, setCollections] = useState<Awaited<ReturnType<typeof getCollections>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      getRestaurants({ city: "თბილისი", page: 1, limit: 12 }),
      getCuisines(),
      getCollections(),
    ])
      .then(([r, c, col]) => {
        setRestaurants(r.data || []);
        setCuisines(c || []);
        setCollections((col || []).filter(x => x.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const heroImage = restaurants[0]?.cover_photo || "";
  const top = useMemo(() => restaurants.slice(0, 4), [restaurants]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = search.trim();
    window.location.href = value ? "/discover/?q=" + encodeURIComponent(value) : "/discover/";
  };

  return (
    <div className="skup-site">
      <SkupHeader />
      <main>
        <section className="home-hero">
          <div className="home-hero-image" style={heroImage ? { backgroundImage: "linear-gradient(90deg, rgba(11,16,14,.9) 0%, rgba(11,16,14,.52) 48%, rgba(11,16,14,.16) 100%), url('" + heroImage + "')" } : undefined} />
          <div className="home-hero-content shell">
            <div className="eyebrow">კარგი საჭმელი ადამიანებს აერთიანებს</div>
            <h1>იპოვე ადგილი,<br/><em>რომლის გახსენებაც</em><br/>მოგინდება.</h1>
            <p>აღმოაჩინე თბილისის საუკეთესო რესტორნები, შეარჩიე საღამო და გააგზავნე ჯავშნის მოთხოვნა რამდენიმე წამში.</p>
            <form className="hero-search" onSubmit={submitSearch}>
              <div className="search-segment"><MapPin size={17}/><span>თბილისი</span></div>
              <label className="search-segment wide">
                <Search size={17}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="რესტორანი, სამზარეულო ან კერძი" aria-label="რესტორნის ძებნა" />
              </label>
              <button type="button" className="search-segment button-segment" onClick={() => window.location.href="/discover/?is_open=true"}><CalendarDays size={17}/><span>დღეს</span></button>
              <div className="search-segment"><Users size={17}/><span>2</span></div>
              <button type="submit" className="hero-search-btn" aria-label="ძებნა"><Search size={18}/></button>
            </form>
            <div className="hero-quick-links">
              {cuisines.slice(0, 7).map(c => (
                <Link key={c.id} href={"/discover/?cuisine_id=" + encodeURIComponent(c.id)} className="hero-chip">
                  <span>{c.icon || "•"}</span><span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell">
          <div className="section-head"><div><span className="kicker">ახლა ქალაქში</span><h2>ტრენდშია თბილისში</h2></div><Link href="/discover/">ყველას ნახვა <ArrowRight size={15}/></Link></div>
          <div className="restaurant-grid four">
            {loading ? Array.from({length: 4}).map((_, i) => <div className="restaurant-skeleton" key={i}/>) : top.map(r => <RestaurantCard key={r.id} restaurant={r}/>)}
          </div>
        </section>

        <section className="section section-soft">
          <div className="shell" id="collections">
            <div className="section-head"><div><span className="kicker">შერჩეული თქვენთვის</span><h2>კოლექციები</h2></div><Link href="/discover/#collections">ყველა <ArrowRight size={15}/></Link></div>
            <div className="collection-grid">
              {collections.slice(0, 5).map(c => (
                <Link key={c.id} href={"/discover/?collection=" + encodeURIComponent(c.id)} className="collection-card" style={{background: c.bg}}>
                  <div className="collection-glow" style={{background: c.accent}} />
                  <div className="collection-copy"><span>{c.emoji}</span><h3>{c.titleKa}</h3><p>{c.subtitle}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell" id="tonight">
          <div className="tonight-banner">
            <div><span className="kicker">ამ საღამოს</span><h2>სად წავიდეთ დღეს?</h2><p>იპოვე ღია რესტორნები თბილისში და სწრაფად გადადი დაჯავშნაზე.</p></div>
            <Link href="/discover/?is_open=true" className="dark-btn">ღია რესტორნები <ArrowRight size={15}/></Link>
          </div>
        </section>

        <section className="section section-dark" id="journal">
          <div className="shell journal-grid">
            <div className="journal-copy"><span className="kicker">LUKMA ჟურნალი</span><h2>ისტორიები კარგი<br/>საჭმლის შესახებ.</h2><p>ახალი ადგილები, გიდები და შერჩეული რეკომენდაციები თბილისის გასტრონომიული სცენიდან.</p><a href="#journal" className="light-outline-btn"><Sparkles size={15}/> მალე</a></div>
            <div className="journal-feature">
              {top[1]?.cover_photo ? <img src={top[1].cover_photo} alt="" /> : <div className="journal-image-fallback" />}
              <div className="journal-feature-copy"><span>გიდი</span><h3>10 ადგილი, რომელიც ამ კვირაში უნდა ნახო</h3><p>LUKMA · 5 წუთი</p></div>
            </div>
          </div>
        </section>
      </main>
      <footer className="skup-footer"><div className="shell"><div className="footer-brand">ლუკმა<span>.</span></div><div>თბილისი, საქართველო</div><div>© {new Date().getFullYear()} LUKMA</div></div></footer>
    </div>
  );
}
