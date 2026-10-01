"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getCollections, getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import { readRecentlyViewed, restaurantPhoto } from "@/lib/lukmaUtils";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

export default function SkupHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [collections, setCollections] = useState<Awaited<ReturnType<typeof getCollections>>>([]);
  const [recent, setRecent] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRecent(readRecentlyViewed());
    Promise.all([
      getRestaurants({ city: "თბილისი", page: 1, limit: 200 }),
      getCuisines(),
      getCollections(),
    ])
      .then(([r, c, col]) => {
        setRestaurants(r.data || []);
        setCuisines((c || []).sort((a,b) => (a.name || "").localeCompare(b.name || "")));
        setCollections((col || []).filter(x => x.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trending = useMemo(() => [...restaurants].sort((a,b) => (Number(b.reviewsCount)||0) - (Number(a.reviewsCount)||0)).slice(0, 4), [restaurants]);
  const heroImage = restaurants[0] ? restaurantPhoto(restaurants[0]) : "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1600";

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
          <div className="home-hero-image" style={{ backgroundImage: "linear-gradient(90deg, rgba(11,16,14,.9) 0%, rgba(11,16,14,.52) 48%, rgba(11,16,14,.16) 100%), url('" + heroImage + "')" }} />
          <div className="home-hero-content shell">
            <div className="eyebrow">Good food brings people together</div>
            <h1>Good food,<br/><em>good company.</em></h1>
            <p>See where people are eating tonight, compare a few places, and book a table.</p>
            <form className="hero-search" onSubmit={submitSearch}>
              <div className="search-segment"><MapPin size={17}/><span>Tbilisi</span></div>
              <label className="search-segment wide"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Restaurant, cuisine or dish" aria-label="Search restaurants" /></label>
              <button type="button" className="search-segment button-segment" onClick={() => window.location.href="/discover/?is_open=true"}><CalendarDays size={17}/><span>Tonight</span></button>
              <div className="search-segment"><Users size={17}/><span>2</span></div>
              <button type="submit" className="hero-search-btn" aria-label="Search"><Search size={18}/></button>
            </form>
            <div className="hero-quick-links">{cuisines.slice(0, 8).map(c => <Link key={c.id} href={"/discover/?cuisine_id=" + encodeURIComponent(c.id)} className="hero-chip"><span>{c.icon || "•"}</span><span>{c.name}</span></Link>)}</div>
          </div>
        </section>

        <section className="section shell">
          <div className="section-head"><div><span className="kicker">In the city now</span><h2>Popular right now</h2></div><Link href="/discover/">View all <ArrowRight size={15}/></Link></div>
          <div className="restaurant-grid four">
            {loading ? Array.from({length:4}).map((_, i) => <div className="restaurant-skeleton" key={i}/>) : trending.map(r => <RestaurantCard key={r.id} restaurant={r}/>)}
          </div>
        </section>

        {recent.length ? <section className="section shell">
          <div className="section-head"><div><span className="kicker">Welcome back</span><h2>Recently viewed</h2></div><Link href="/discover/">Discover more <ArrowRight size={15}/></Link></div>
          <div className="restaurant-grid four">{recent.slice(0,4).map(r=><RestaurantCard key={r.id} restaurant={r} compact />)}</div>
        </section> : null}

        <section className="section section-soft"><div className="shell" id="collections">
          <div className="section-head"><div><span className="kicker">Curated for you</span><h2>Collections</h2></div><Link href="/discover/#collections">All <ArrowRight size={15}/></Link></div>
          <div className="collection-grid">{collections.slice(0, 6).map(c => <Link key={c.id} href={"/discover/?collection=" + encodeURIComponent(c.id)} className="collection-card" style={{background:c.bg}}><div className="collection-glow" style={{background:c.accent}}/><div className="collection-copy"><span>{c.emoji}</span><h3>{c.titleKa}</h3><p>{c.subtitle}</p></div></Link>)}</div>
        </div></section>

        <section className="section shell" id="tonight"><div className="tonight-banner"><div><span className="kicker">Tonight</span><h2>Looking for dinner?</h2><p>Open Now, map nearby places, and book without leaving the flow.</p></div><Link href="/discover/?is_open=true" className="dark-btn">Open restaurants <ArrowRight size={15}/></Link></div></section>

        <section className="section section-dark"><div className="shell journal-grid">
          <div className="journal-copy"><span className="kicker">LUKMA Journal</span><h2>Stories about<br/>great food.</h2><p>New places, guides, and curated recommendations from Tbilisi food scene.</p><Link href="/journal/" className="light-outline-btn"><Sparkles size={15}/> Read the journal</Link></div>
          <div className="journal-feature">{trending[1] ? <img src={restaurantPhoto(trending[1])} alt="" /> : <div className="journal-image-fallback"/>}<div className="journal-feature-copy"><span>Guide</span><h3>Places worth your next evening</h3><p>LUKMA · curated for you</p></div></div>
        </div></section>
      </main>
      <footer className="skup-footer"><div className="shell"><div className="footer-brand"><img src="/lukma-logo.svg" alt="LUKMA" /><span>LUKMA</span></div><div><Link href="/about/">About</Link> · <Link href="/privacy/">Privacy</Link> · <Link href="/terms/">Terms</Link></div><div>Tbilisi, Georgia</div><div>© {new Date().getFullYear()} LUKMA</div></div></footer>
    </div>
  );
}
