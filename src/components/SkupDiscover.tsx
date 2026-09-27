"use client";

import Link from "next/link";
import { LocateFixed, MapPin, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

function mapPosition(r: Restaurant, zoom: number, center: { lat: number; lng: number }) {
  const span = 0.20 / zoom;
  const west = center.lng - span;
  const east = center.lng + span;
  const south = center.lat - span * 0.7;
  const north = center.lat + span * 0.7;
  const left = Math.max(2, Math.min(98, ((Number(r.longitude) - west) / (east - west)) * 100));
  const top = Math.max(4, Math.min(96, ((north - Number(r.latitude)) / (north - south)) * 100));
  return { left: left + "%", top: top + "%" };
}

function mapUrl(zoom: number, center: { lat: number; lng: number }) {
  const span = 0.20 / zoom;
  const west = center.lng - span;
  const east = center.lng + span;
  const south = center.lat - span * 0.7;
  const north = center.lat + span * 0.7;
  return "https://www.openstreetmap.org/export/embed.html?bbox=" +
    [west, south, east, north].map(v => v.toFixed(5)).join("%2C") +
    "&layer=mapnik&marker=" + center.lat + "%2C" + center.lng;
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
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ lat: 41.7151, lng: 44.8271 });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q") || "";
    const initialCuisine = params.get("cuisine_id") || "";
    const initialOpen = params.get("is_open") === "true";
    const initialRating = params.get("min_rating") || "";
    setQ(initialQ);
    setCuisineId(initialCuisine);
    setIsOpen(initialOpen);
    setMinRating(initialRating);
    getCuisines().then(setCuisines).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getRestaurants({
        city: "თბილისი",
        q: q.trim() || undefined,
        cuisine_id: cuisineId || undefined,
        is_open: isOpen || undefined,
        min_rating: minRating || undefined,
        page: 1,
        limit: 50,
      })
        .then(r => {
          if (cancelled) return;
          setRestaurants(r.data || []);
          setSelected(prev => (prev && r.data.some(x => x.id === prev)) ? prev : r.data?.[0]?.id || "");
        })
        .catch(() => {
          if (!cancelled) setError("Restaurants could not be loaded right now.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, cuisineId, isOpen, minRating]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cuisineId) params.set("cuisine_id", cuisineId);
    if (isOpen) params.set("is_open", "true");
    if (minRating) params.set("min_rating", minRating);
    const next = params.toString() ? "/discover/?" + params.toString() : "/discover/";
    window.history.replaceState(null, "", next);
  }, [q, cuisineId, isOpen, minRating]);

  const filtered = useMemo(() => restaurants.filter(r => {
    const hay = (r.name + " " + (r.description || "") + " " + r.address + " " + (r.district || "") + " " + (r.cuisine?.name || "")).toLowerCase();
    return !q || hay.includes(q.toLowerCase());
  }), [restaurants, q]);

  const visibleMap = filtered.slice(0, 18);
  const selectedRestaurant = filtered.find(r => r.id === selected) || filtered[0];

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setZoom(1.7);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not access your location.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const clearFilters = () => {
    setQ("");
    setCuisineId("");
    setIsOpen(false);
    setMinRating("");
  };

  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="discover-page">
        <section className="discover-head shell">
          <div>
            <span className="kicker">Discover</span>
            <h1>Discover restaurants<br/>in Tbilisi</h1>
            <p>Find the right place for any evening — city, flavor, and mood in one place.</p>
          </div>
          <div className="discover-search">
            <Search size={17}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Restaurant, cuisine or dish..." />
            {q ? <button aria-label="Clear search" onClick={() => setQ("")}><X size={15}/></button> : null}
          </div>
        </section>

        <section className="discover-toolbar shell">
          <div className="filter-scroll">
            <button className={!cuisineId ? "active" : ""} onClick={() => setCuisineId("")}>All</button>
            {cuisines.slice(0, 10).map(c => (
              <button key={c.id} className={cuisineId === c.id ? "active" : ""} onClick={() => setCuisineId(cuisineId === c.id ? "" : c.id)}>
                {c.icon || "•"} {c.name}
              </button>
            ))}
          </div>
          <div className="filter-actions">
            <button className={minRating === "4.5" ? "active" : ""} onClick={() => setMinRating(minRating === "4.5" ? "" : "4.5")}><Star size={14}/> 4.5+</button>
            <button className={isOpen ? "active" : ""} onClick={() => setIsOpen(!isOpen)}>Open now</button>
            <button className="filter-more" onClick={clearFilters}><SlidersHorizontal size={14}/> Clear</button>
          </div>
        </section>

        <section className="discover-layout shell" id="map">
          <aside className="discover-list">
            <div className="results-row">
              <strong>{loading ? "…" : filtered.length}</strong> restaurant
              <span>{(cuisineId || minRating || isOpen || q) ? <button className="results-clear" onClick={clearFilters}>Clear filters</button> : null}</span>
            </div>
            {error ? <div className="inline-error">{error}</div> : null}
            {loading ? Array.from({length: 6}).map((_, i) => <div className="list-skeleton" key={i}/>) :
              filtered.map(r => (
                <RestaurantCard key={r.id} restaurant={r} compact selected={selected === r.id} onHover={() => setSelected(r.id)} />
              ))}
            {!loading && !filtered.length ? (
              <div className="empty-state">
                <Search size={22}/>
                <h3>Nothing found</h3>
                <p>Change your search or filters and try again.</p>
                <button className="green-btn small" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : null}
          </aside>

          <div className="map-panel">
            <iframe title="Tbilisi map" src={mapUrl(zoom, center)} loading="lazy" />
            <div className="map-overlay-pins">
              {visibleMap.map(r => (
                <Link
                  key={r.id}
                  href={"/restaurant/?id=" + encodeURIComponent(r.id)}
                  className={"map-pin " + (selected === r.id ? "active" : "")}
                  style={mapPosition(r, zoom, center)}
                  onMouseEnter={() => setSelected(r.id)}
                >
                  <span><Star size={9} fill="currentColor"/>{Number(r.ratingAvg || 0).toFixed(1)}</span>
                </Link>
              ))}
            </div>
            <div className="map-controls">
              <button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(.75, +(z - .25).toFixed(2)))}>−</button>
              <button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(3, +(z + .25).toFixed(2)))}>+</button>
              <button aria-label="My location" onClick={useMyLocation} disabled={locating}><LocateFixed size={16}/></button>
            </div>
            {selectedRestaurant ? (
              <Link href={"/restaurant/?id=" + encodeURIComponent(selectedRestaurant.id)} className="map-preview-card">
                {selectedRestaurant.cover_photo ? <img src={selectedRestaurant.cover_photo} alt="" /> : null}
                <div><strong>{selectedRestaurant.name}</strong><span><Star size={11} fill="currentColor"/> {Number(selectedRestaurant.ratingAvg || 0).toFixed(1)} · {selectedRestaurant.district || selectedRestaurant.city}</span></div>
              </Link>
            ) : null}
            <div className="map-label"><MapPin size={11}/> Tbilisi · <strong>{filtered.length}</strong> places</div>
          </div>
        </section>
      </main>
    </div>
  );
}
