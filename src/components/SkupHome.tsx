"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getAvailabilitySummary, getCollections, getCuisines, getOffers, getRestaurants, type Cuisine, type Restaurant, type RestaurantOffer } from "@/lib/skupApi";
import { readRecentlyViewed, restaurantPhoto } from "@/lib/lukmaUtils";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

export default function SkupHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [collections, setCollections] = useState<Awaited<ReturnType<typeof getCollections>>>([]);
  const [offers, setOffers] = useState<RestaurantOffer[]>([]);
  const [availableTonight, setAvailableTonight] = useState<(Restaurant & { availableTimes?: string[] })[]>([]);
  const [recent, setRecent] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRecent(readRecentlyViewed());
    Promise.allSettled([
      getRestaurants({ city: "თბილისი", page: 1, limit: 200 }),
      getCuisines(),
      getCollections(),
      getOffers({ date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" }), guests: 2 }),
      getAvailabilitySummary(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" }), 2, 16),
    ])
      .then(([r, c, col, offerResult, availabilityResult]) => {
        if (r.status === "fulfilled") {
          setRestaurants(r.value.data || []);
        } else {
          setLoadError("Restaurants are temporarily unavailable. Please try again.");
        }
        if (c.status === "fulfilled") {
          setCuisines((c.value || []).sort((a,b) => (a.name || "").localeCompare(b.name || "")));
        }
        if (col.status === "fulfilled") {
          setCollections((col.value || []).filter(x => x.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
        }
        if (offerResult.status === "fulfilled") {
          setOffers((offerResult.value || []).filter(x => x.isActive));
        }
        if (availabilityResult.status === "fulfilled") {
          setAvailableTonight(availabilityResult.value?.restaurants || []);
        }
      })
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
          {loadError ? <div className="home-data-error"><span>{loadError}</span><Link href="/discover/" className="outline-btn small">Open Discover</Link></div> : null}
          <div className="restaurant-grid four">
            {loading ? Array.from({length:4}).map((_, i) => <div className="restaurant-skeleton" key={i}/>) : trending.length ? trending.map(r => <RestaurantCard key={r.id} restaurant={r}/>) : <div className="home-empty">No restaurants available right now.</div>}
          </div>
        </section>
        {availableTonight.length ? <section className="section section-soft">
          <div className="shell">
            <div className="section-head"><div><span className="kicker">Bookable now</span><h2>Available tonight</h2></div><Link href="/discover/">See all <ArrowRight size={15}/></Link></div>
            <div className="restaurant-grid four">{availableTonight.slice(0,4).map(r=><div key={r.id}><RestaurantCard restaurant={r}/><div className="home-availability-times">{(r.availableTimes || []).slice(0,3).map(t=><Link key={t} href={"/restaurant/?id="+encodeURIComponent(r.id)+"&date="+encodeURIComponent(new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Tbilisi"}))+"&guests=2&time="+encodeURIComponent(t)}>{t}</Link>)}</div></div>)}</div>
          </div>
        </section> : null}
        {restaurants.some(r => Number(r.discountPercent) > 0) || offers.length > 0 ? <section className="section shell">
          <div className="section-head"><div><span className="kicker">Save on your table</span><h2>Best offers</h2></div><Link href="/discover/?offers=true">All offers <ArrowRight size={15}/></Link></div>
          <div className="restaurant-grid four">{restaurants.filter(r => Number(r.discountPercent) > 0 || offers.some(o => o.restaurantId === r.id)).sort((a,b) => Math.max(Number(b.discountPercent||0), Number(offers.find(o=>o.restaurantId===b.id)?.discountPercent||0)) - Math.max(Number(a.discountPercent||0), Number(offers.find(o=>o.restaurantId===a.id)?.discountPercent||0))).slice(0,4).map(r => <RestaurantCard key={r.id} restaurant={r}/>)}</div>
        </section> : null}

        {cuisines.length ? <section className="section section-soft">
          <div className="shell">
            <div className="section-head"><div><span className="kicker">Explore by taste</span><h2>Cuisines</h2></div><Link href="/discover/">Explore <ArrowRight size={15}/></Link></div>
            <div className="home-cuisine-row">{cuisines.slice(0,10).map(c => <Link key={c.id} href={"/discover/?cuisine_id="+encodeURIComponent(c.id)} className="home-cuisine-card"><span>{c.icon || "🍽️"}</span><strong>{c.name}</strong><small>Explore</small></Link>)}</div>
          </div>
        </section> : null}

        {restaurants.some(r => r.isOpen) ? <section className="section shell">
          <div className="section-head"><div><span className="kicker">Right now</span><h2>Open now</h2></div><Link href="/discover/?is_open=true">See all <ArrowRight size={15}/></Link></div>
          <div className="restaurant-grid four">{restaurants.filter(r => r.isOpen).slice(0,4).map(r => <RestaurantCard key={r.id} restaurant={r}/>)}</div>
        </section> : null}

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
