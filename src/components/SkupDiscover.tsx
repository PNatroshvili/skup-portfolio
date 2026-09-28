"use client";

import Link from "next/link";
import { LocateFixed, Search, SlidersHorizontal, Star, X, Shuffle, ArrowDownUp, Share2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { getCollections, getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import { restaurantPhoto } from "@/lib/lukmaUtils";
import RestaurantCard from "./SkupRestaurantCard";
import SkupHeader from "./SkupHeader";

const DIETARY: Record<string,string[]> = {
  vegan:["vegan","ვეგან"],
  vegetarian:["vegetarian","ვეგეტარიან"],
  halal:["halal","ჰალალ"],
  glutenfree:["gluten","გლუტენ"],
  seafood:["seafood","fish","ზღ","თევზ"],
};

function distanceKm(aLat:number,aLng:number,bLat:number,bLng:number){
  const R=6371,dLat=(bLat-aLat)*Math.PI/180,dLng=(bLng-aLng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function readSearchHistory(){try{return JSON.parse(localStorage.getItem("lukma_search_history")||"[]") as string[]}catch{return []}}
function saveSearchHistory(q:string){try{const next=[q,...readSearchHistory().filter(x=>x!==q)].slice(0,6);localStorage.setItem("lukma_search_history",JSON.stringify(next));return next}catch{return []}}

export default function SkupDiscover(){
  const [restaurants,setRestaurants]=useState<Restaurant[]>([]);
  const [cuisines,setCuisines]=useState<Cuisine[]>([]);
  const [collections,setCollections]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [cuisineId,setCuisineId]=useState("");
  const [collectionId,setCollectionId]=useState("");
  const [isOpen,setIsOpen]=useState(false);
  const [minRating,setMinRating]=useState("");
  const [discountOnly,setDiscountOnly]=useState(false);
  const [priceLevel,setPriceLevel]=useState("");
  const [dietary,setDietary]=useState<string[]>([]);
  const [sort,setSort]=useState<"rating"|"name"|"discount"|"distance">("rating");
  const [nearMe,setNearMe]=useState(false);
  const [userLocation,setUserLocation]=useState<{lat:number;lng:number}|null>(null);
  const [selected,setSelected]=useState("");
  const mapElementRef=useRef<HTMLDivElement|null>(null);
  const leafletMapRef=useRef<import("leaflet").Map|null>(null);
  const markerLayerRef=useRef<import("leaflet").LayerGroup|null>(null);
  const [history,setHistory]=useState<string[]>([]);
  const [showFilters,setShowFilters]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [visibleCount,setVisibleCount]=useState(20);
  const [searchReady,setSearchReady]=useState(false);

  useEffect(()=>{
    let disposed=false;
    let map: import("leaflet").Map|undefined;
    import("leaflet").then(L=>{
      if(disposed || !mapElementRef.current || leafletMapRef.current) return;
      map=L.map(mapElementRef.current,{
        center:[41.7151,44.8271],
        zoom:12.4,
        minZoom:10,
        maxZoom:18,
        scrollWheelZoom:false,
        zoomControl:false,
        worldCopyJump:true,
        attributionControl:true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        maxZoom:19,
        attribution:'© OpenStreetMap contributors',
      }).addTo(map);
      markerLayerRef.current=L.layerGroup().addTo(map);
      leafletMapRef.current=map;
      window.setTimeout(()=>map?.invalidateSize(),0);
    });
    return ()=>{
      disposed=true;
      if(map){map.remove();}
      leafletMapRef.current=null;
      markerLayerRef.current=null;
    };
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    setQ(params.get("q")||"");
    setCuisineId(params.get("cuisine_id")||"");
    setIsOpen(params.get("is_open")==="true");
    setMinRating(params.get("min_rating")||"");
    setCollectionId(params.get("collection")||"");
    setDiscountOnly(params.get("offers")==="true");
    setPriceLevel(params.get("price")||"");
    setDietary((params.get("dietary")||"").split(",").filter(x=>DIETARY[x]));
    const requestedSort=params.get("sort");
    if (requestedSort==="name" || requestedSort==="discount" || requestedSort==="distance") setSort(requestedSort);
    setHistory(readSearchHistory());
    setSearchReady(true);
    Promise.all([getCuisines(),getCollections(),getRestaurants({city:"თბილისი",page:1,limit:200})])
      .then(([c,col,r])=>{
        setCuisines((c||[]).sort((a,b)=>(a.name||"").localeCompare(b.name||"")));
        setCollections((col||[]).filter(x=>x.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        setRestaurants(r.data||[]);
        setSelected(r.data?.[0]?.id||"");
      })
      .catch(()=>setError("Restaurants could not be loaded right now."))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!searchReady) return;
    setVisibleCount(20);
    const params=new URLSearchParams();
    if(q.trim())params.set("q",q.trim());
    if(cuisineId)params.set("cuisine_id",cuisineId);
    if(collectionId)params.set("collection",collectionId);
    if(isOpen)params.set("is_open","true");
    if(minRating)params.set("min_rating",minRating);
    if(discountOnly)params.set("offers","true");
    if(priceLevel)params.set("price",priceLevel);
    if(dietary.length)params.set("dietary",dietary.join(","));
    if(sort!=="rating")params.set("sort",sort);
    window.history.replaceState(null,"",params.toString()?"/discover/?"+params.toString():"/discover/");
  },[searchReady,q,cuisineId,collectionId,isOpen,minRating,discountOnly,priceLevel,dietary,sort,nearMe]);

  const filtered=useMemo(()=>{
    return restaurants.filter(r=>{
      const hay=(r.name+" "+(r.description||"")+" "+r.address+" "+(r.district||"")+" "+(r.cuisine?.name||"")).toLowerCase();
      if(q.trim()&&!hay.includes(q.toLowerCase()))return false;
      if(cuisineId&&r.cuisine?.id!==cuisineId)return false;
      if(collectionId){
        const collection=collections.find(x=>x.id===collectionId);
        if(collection?.filterType==="is_open" && !r.isOpen)return false;
        if((collection?.filterType==="cuisine_id" || collection?.filterType==="cuisine") && collection.filterValue && r.cuisine?.id!==collection.filterValue)return false;
        if((collection?.filterType==="discount" || collection?.filterType==="offer") && !Number(r.discountPercent||0))return false;
        if((collection?.filterType==="rating" || collection?.filterType==="min_rating") && collection.filterValue && Number(r.ratingAvg||0)<Number(collection.filterValue))return false;
        if((collection?.filterType==="q" || collection?.filterType==="keyword") && collection.filterValue && !hay.includes(String(collection.filterValue).toLowerCase()))return false;
      }
      if(isOpen&&!r.isOpen)return false;
      if(minRating&&Number(r.ratingAvg)<Number(minRating))return false;
      if(discountOnly&&!Number(r.discountPercent||0))return false;
      if(priceLevel&&String((r as any).priceLevel||"")!==priceLevel)return false;
      if(dietary.length&&!dietary.every(key=>DIETARY[key].some(word=>hay.includes(word))))return false;
      return true;
    });
  },[restaurants,q,cuisineId,collectionId,collections,isOpen,minRating,discountOnly,priceLevel,dietary]);

  const sorted=useMemo(()=>{
    const list=[...filtered];
    if(sort==="distance"&&userLocation)return list.sort((a,b)=>distanceKm(userLocation.lat,userLocation.lng,Number(a.latitude),Number(a.longitude))-distanceKm(userLocation.lat,userLocation.lng,Number(b.latitude),Number(b.longitude)));
    if(sort==="name")return list.sort((a,b)=>a.name.localeCompare(b.name));
    if(sort==="discount")return list.sort((a,b)=>Number(b.discountPercent||0)-Number(a.discountPercent||0));
    return list.sort((a,b)=>Number(b.ratingAvg||0)-Number(a.ratingAvg||0));
  },[filtered,sort,userLocation]);

  const visible=sorted.slice(0,visibleCount);
  const selectedRestaurant=sorted.find(r=>r.id===selected)||sorted[0];

  useEffect(()=>{
    if(!sorted.length){setSelected("");return;}
    if(!sorted.some(r=>r.id===selected))setSelected(sorted[0].id);
  },[sorted,selected]);

  useEffect(()=>{
    let disposed=false;
    const paintMarkers=async()=>{
      const map=leafletMapRef.current;
      const layer=markerLayerRef.current;
      if(!map || !layer)return;
      const L=await import("leaflet");
      if(disposed)return;
      layer.clearLayers();
      sorted.slice(0,120).forEach(r=>{
        const lat=Number(r.latitude),lng=Number(r.longitude);
        if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
        const selectedMarker=r.id===selected;
        const discount=Number(r.discountPercent||0);
        const marker=L.marker([lat,lng],{
          icon:L.divIcon({
            className:"lukma-map-marker-wrap",
            html:'<button class="lukma-map-marker '+(selectedMarker?'selected':'')+'" type="button"><span>'+Number(r.ratingAvg||0).toFixed(1)+'</span>'+(discount?'<em>-'+discount+'%</em>':"")+'</button>',
            iconSize:[48,32],
            iconAnchor:[24,16],
          }),
          keyboard:true,
          title:r.name,
          alt:r.name,
        });
        marker.on("click",()=>selectRestaurant(r,true));
        marker.addTo(layer);
      });
      if(userLocation){
        L.circleMarker([userLocation.lat,userLocation.lng],{
          radius:7,
          color:"#ffffff",
          weight:3,
          fillColor:"#176f4c",
          fillOpacity:1,
        }).addTo(layer);
        L.circle([userLocation.lat,userLocation.lng],{
          radius:65,
          color:"#176f4c",
          weight:1,
          fillColor:"#176f4c",
          fillOpacity:.10,
        }).addTo(layer);
      }
    };
    paintMarkers();
    return()=>{disposed=true;};
  },[sorted,selected,userLocation]);

  const selectRestaurant=(r:Restaurant,focusList=false)=>{
    setSelected(r.id);
    const lat=Number(r.latitude);
    const lng=Number(r.longitude);
    if(leafletMapRef.current && Number.isFinite(lat) && Number.isFinite(lng)){
      leafletMapRef.current.flyTo([lat,lng],Math.max(leafletMapRef.current.getZoom(),14.8),{duration:.45});
    }
    if(focusList){
      const target=Array.from(document.querySelectorAll<HTMLElement>("[data-restaurant-id]"))
        .find(node=>node.dataset.restaurantId===r.id);
      target?.scrollIntoView({behavior:"smooth",block:"nearest"});
    }
  };

  const toggleNearMe=()=>{
    if(nearMe){setNearMe(false);if(sort==="distance")setSort("rating");return;}
    if(!navigator.geolocation){setError("Location is not available on this device.");return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      const next={lat:pos.coords.latitude,lng:pos.coords.longitude};
      setUserLocation(next);
      setNearMe(true);
      setSort("distance");
      leafletMapRef.current?.flyTo([next.lat,next.lng],14.5,{duration:.5});
    },()=>setError("Could not access your location."),{enableHighAccuracy:false,timeout:8000});
  };

  const clearFilters=()=>{
    setQ("");setCuisineId("");setCollectionId("");setIsOpen(false);setMinRating("");setDiscountOnly(false);setPriceLevel("");setDietary([]);setNearMe(false);setSort("rating");
  };
  const resetMap=()=>leafletMapRef.current?.flyTo([41.7151,44.8271],12.4,{duration:.5});

  const surprise=()=>{if(!sorted.length)return;const r=sorted[Math.floor(Math.random()*sorted.length)];selectRestaurant(r);};

  const shareSearch=async()=>{
    const url=window.location.href;
    try {
      if(navigator.share) await navigator.share({title:"LUKMA restaurant search",text:"Restaurants I found on LUKMA",url});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url);setError("Search link copied to clipboard.");setTimeout(()=>setError(""),2200);}
    } catch {}
  };

  return <div className="skup-site">
    <SkupHeader/>
    <main className="discover-page">
      <section className="discover-head shell">
        <div>
          <span className="kicker">Discover</span>
          <h1>Restaurants worth<br/>going to.</h1>
          <p>Search by restaurant, cuisine, rating, offers or distance.</p>
        </div>
        <div className="discover-search">
          <Search size={17}/>
          <input value={q} onChange={e=>setQ(e.target.value)} onBlur={()=>{if(q.trim())setHistory(saveSearchHistory(q.trim()))}} placeholder="Restaurant, cuisine or dish…"/>
          {q?<button aria-label="Clear search" onClick={()=>setQ("")}><X size={15}/></button>:null}
        </div>
      </section>

      <section className="discover-toolbar shell">
        <div className="discover-filter-scroll">
          <button className={"filter-chip "+(nearMe?"active":"")} onClick={toggleNearMe}><LocateFixed size={14}/>{nearMe?"Near me":"Near me"}</button>
          <button className={"filter-chip "+(isOpen?"active":"")} onClick={()=>setIsOpen(!isOpen)}><span className={"filter-dot "+(isOpen?"on":"")}></span>Open now</button>
          <button className={"filter-chip "+(minRating?"active":"")} onClick={()=>setMinRating(minRating?"":"4")}><Star size={13} fill="currentColor"/>{minRating?minRating+"+ rating":"Rating"}</button>
          <button className={"filter-chip "+(discountOnly?"active":"")} onClick={()=>setDiscountOnly(!discountOnly)}>🏷️ Offers</button>
          <button className={"filter-chip "+(showFilters?"active":"")} onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={14}/> Filters</button>
          <button className="filter-chip surprise" onClick={surprise}><Shuffle size={13}/> Surprise me</button>
          {(q||cuisineId||collectionId||isOpen||minRating||discountOnly||priceLevel||dietary.length)?<button className="filter-chip" onClick={shareSearch}><Share2 size={13}/> Share search</button>:null}
          {(q||cuisineId||isOpen||minRating||discountOnly||priceLevel||dietary.length||nearMe)?<button className="filter-clear" onClick={clearFilters}><X size={13}/> Clear</button>:null}
        </div>
        <div className="discover-toolbar-right">
          <span>{sorted.length} restaurants</span>
          <button className="sort-button" onClick={()=>setSort(sort==="rating"?"name":sort==="name"?"discount":sort==="discount"?(nearMe?"distance":"rating"):"rating")}><ArrowDownUp size={13}/>{sort==="rating"?"Rating":sort==="name"?"Name":sort==="discount"?"Offers":"Distance"}</button>
        </div>
      </section>

      {showFilters?<section className="discover-filter-panel shell">
        <div><span className="filter-panel-label">Cuisine</span><div className="filter-options">{cuisines.map(c=><button key={c.id} className={cuisineId===c.id?"selected":""} onClick={()=>setCuisineId(cuisineId===c.id?"":c.id)}>{c.icon||"•"} {c.name}</button>)}</div></div>
        <div><span className="filter-panel-label">Price</span><div className="filter-options">{["1","2","3"].map(v=><button key={v} className={priceLevel===v?"selected":""} onClick={()=>setPriceLevel(priceLevel===v?"":v)}>{"₾".repeat(Number(v))} <small>{v==="1"?"Everyday":v==="2"?"Mid-range":"Premium"}</small></button>)}</div></div>
        <div><span className="filter-panel-label">Dietary</span><div className="filter-options">{Object.keys(DIETARY).map(v=><button key={v} className={dietary.includes(v)?"selected":""} onClick={()=>setDietary(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}>{v==="vegan"?"🌱":v==="vegetarian"?"🥗":v==="halal"?"☪️":v==="glutenfree"?"🌾":"🦐"} {v}</button>)}</div></div>
      </section>:null}

      {history.length&&q.length===0?<section className="shell search-history"><span>Recent searches</span>{history.map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</section>:null}

      {error?<div className="shell inline-error discover-error">{error}</div>:null}

      <section className="discover-layout shell" id="map">
        <aside className="discover-list">
          <div className="discover-results-head"><strong>{sorted.length}</strong> restaurants {selectedRestaurant?<span>· {selectedRestaurant.name}</span>:null}</div>
          {loading?<div className="discover-loading-list">{Array.from({length:6}).map((_,i)=><div key={i} className="restaurant-skeleton"/>)}</div>:
            visible.length?<div className="discover-cards">{visible.map(r=><div key={r.id} data-restaurant-id={r.id} onMouseEnter={()=>setSelected(r.id)} onClick={()=>selectRestaurant(r)} className={"discover-card-wrap "+(r.id===selectedRestaurant?.id?"selected":"")}><RestaurantCard restaurant={r}/></div>)}</div>:
            <div className="discover-empty"><Search size={28}/><h3>Nothing found</h3><p>Change your search or filters and try again.</p><button className="green-btn" onClick={clearFilters}>Clear filters</button></div>}
          {visible.length<sorted.length?<button className="discover-load-more" onClick={()=>setVisibleCount(v=>v+20)}>Show more · {sorted.length-visible.length} left</button>:null}
        </aside>
        <div className="discover-map-card">
          <iframe title="Tbilisi restaurant map" src={mapUrl(zoom,center)} loading="lazy"/>
          <div className="map-overlay-top"><span>{sorted.length} places</span><button onClick={()=>{setCenter({lat:41.7151,lng:44.8271});setZoom(1)}}>Reset</button></div>
          <div className="map-controls"><button onClick={()=>setZoom(z=>Math.max(.7,z-.3))}>−</button><button onClick={()=>setZoom(z=>Math.min(4,z+.3))}>+</button></div>
          {visible.slice(0,60).map(r=><button key={r.id} className={"map-pin "+(r.id===selectedRestaurant?.id?"selected":"")} style={mapPosition(r,zoom,center)} onClick={()=>selectRestaurant(r)} aria-label={"Open "+r.name}><span>{Number(r.ratingAvg||0).toFixed(1)}</span>{r.discountPercent?<em>-{r.discountPercent}%</em>:null}</button>)}
          {selectedRestaurant?<div className="map-selected-card"><img src={restaurantPhoto(selectedRestaurant)} alt=""/><div><strong>{selectedRestaurant.name}</strong><span>{selectedRestaurant.cuisine?.name||"Restaurant"} · {selectedRestaurant.district||selectedRestaurant.city}</span><small><Star size={11} fill="currentColor"/> {Number(selectedRestaurant.ratingAvg||0).toFixed(1)} · {selectedRestaurant.address}</small></div><Link href={"/restaurant/?id="+encodeURIComponent(selectedRestaurant.id)}>View</Link></div>:null}
        </div>
      </section>

      {collections.length?<section className="section section-soft discover-collections"><div className="shell"><div className="section-head"><div><span className="kicker">Curated</span><h2>Collections</h2></div></div><div className="collection-grid">{collections.slice(0,6).map(c=><Link key={c.id} href={"/discover/?collection="+encodeURIComponent(c.id)} className="collection-card" style={{background:c.bg}}><div className="collection-glow" style={{background:c.accent}}/><div className="collection-copy"><span>{c.emoji}</span><h3>{c.titleKa}</h3><p>{c.subtitle}</p></div></Link>)}</div></div></section>:null}
    </main>
  </div>;
}
