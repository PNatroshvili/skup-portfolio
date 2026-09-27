"use client";

import Link from "next/link";
import { ChevronDown, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

const BBOX = { west: 44.72, east: 44.92, north: 41.78, south: 41.64 };

function mapPosition(r: Restaurant) {
  const left = Math.max(2, Math.min(96, ((Number(r.longitude) - BBOX.west) / (BBOX.east - BBOX.west)) * 100));
  const top = Math.max(4, Math.min(92, ((BBOX.north - Number(r.latitude)) / (BBOX.north - BBOX.south)) * 100));
  return { left: left + "%", top: top + "%" };
}

export default function SkupDiscover() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [q, setQ] = useState("");
  const [cuisineId, setCuisineId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [minRating, setMinRating] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCuisine = params.get("cuisine_id") || "";
    const initialOpen = params.get("is_open") === "true";
    setCuisineId(initialCuisine);
    setIsOpen(initialOpen);
    Promise.all([getCuisines(), getRestaurants({ city: "თბილისი", page: 1, limit: 50 })])
      .then(([c, r]) => { setCuisines(c || []); setRestaurants(r.data || []); })
      .catch(() => setError("რესტორნების ჩატვირთვა ამ მომენტში ვერ მოხერხდა."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => restaurants.filter(r => {
    const hay = (r.name + " " + (r.description || "") + " " + r.address + " " + (r.district || "") + " " + (r.cuisine?.name || "")).toLowerCase();
    const matchesQ = !q || hay.includes(q.toLowerCase());
    const matchesCuisine = !cuisineId || r.cuisine?.id === cuisineId;
    const matchesOpen = !isOpen || Boolean(r.workingHours?.length);
    const matchesRating = !minRating || Number(r.ratingAvg) >= Number(minRating);
    return matchesQ && matchesCuisine && matchesOpen && matchesRating;
  }), [restaurants, q, cuisineId, isOpen, minRating]);

  const visibleMap = filtered.slice(0, 18);
  const selectedRestaurant = filtered.find(r => r.id === selected) || filtered[0];

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="discover-page">
        <section className="discover-head shell">
          <div><span className="kicker">აღმოჩენა</span><h1>აღმოაჩინე რესტორნები<br/>თბილისში</h1><p>იპოვე ადგილი ნებისმიერი საღამოსთვის — ქალაქი, გემო და განწყობა ერთ სივრცეში.</p></div>
          <div className="discover-search"><Search size={17}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="რესტორანი, სამზარეულო ან კერძი..." /></div>
        </section>

        <section className="discover-toolbar shell">
          <div className="filter-scroll">
            <button className={!cuisineId ? "active" : ""} onClick={() => setCuisineId("")}>ყველა</button>
            {cuisines.slice(0, 7).map(c => <button key={c.id} className={cuisineId === c.id ? "active" : ""} onClick={() => setCuisineId(cuisineId === c.id ? "" : c.id)}>{c.icon || "•"} {c.name}</button>)}
          </div>
          <div className="filter-actions">
            <button className={minRating === "4.5" ? "active" : ""} onClick={() => setMinRating(minRating === "4.5" ? "" : "4.5")}><Star size={14}/> 4.5+</button>
            <button className={isOpen ? "active" : ""} onClick={() => setIsOpen(!isOpen)}>ღიაა ახლა</button>
            <button className="filter-more"><SlidersHorizontal size={14}/> ფილტრები <ChevronDown size={14}/></button>
          </div>
        </section>

        <section className="discover-layout shell" id="map">
          <aside className="discover-list">
            <div className="results-row"><strong>{filtered.length}</strong> რესტორანი <span>თბილისი</span></div>
            {error ? <div className="inline-error">{error}</div> : null}
            {loading ? Array.from({length: 6}).map((_, i) => <div className="list-skeleton" key={i}/>) :
              filtered.map(r => <RestaurantCard key={r.id} restaurant={r} compact selected={selected === r.id} onHover={() => setSelected(r.id)} />)}
            {!loading && !filtered.length ? <div className="empty-state"><Search size={22}/><h3>ვერაფერი ვიპოვეთ</h3><p>შეცვალე ძიება ან ფილტრები.</p></div> : null}
          </aside>

          <div className="map-panel">
            <iframe title="თბილისის რუკა" src="https://www.openstreetmap.org/export/embed.html?bbox=44.72%2C41.64%2C44.92%2C41.78&amp;layer=mapnik" loading="lazy" />
            <div className="map-overlay-pins">
              {visibleMap.map(r => <Link key={r.id} href={"/restaurant/?id=" + encodeURIComponent(r.id)} className={"map-pin " + (selected === r.id ? "active" : "")} style={mapPosition(r)} onMouseEnter={() => setSelected(r.id)}><span><Star size={9} fill="currentColor"/>{Number(r.ratingAvg || 0).toFixed(1)}</span></Link>)}
            </div>
            <div className="map-controls"><button>−</button><button>+</button><button><MapPin size={16}/></button></div>
            {selectedRestaurant ? <Link href={"/restaurant/?id=" + encodeURIComponent(selectedRestaurant.id)} className="map-preview-card">
              {selectedRestaurant.cover_photo ? <img src={selectedRestaurant.cover_photo} alt="" /> : null}
              <div><strong>{selectedRestaurant.name}</strong><span><Star size={11} fill="currentColor"/> {Number(selectedRestaurant.ratingAvg || 0).toFixed(1)} · {selectedRestaurant.district || selectedRestaurant.city}</span></div>
              </Link> : null}
            <div className="map-label">თბილისი · <strong>{filtered.length}</strong> ადგილი</div>
          </div>
        </section>
      </main>
    </div>
  );
}
