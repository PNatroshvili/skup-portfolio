"use client";

import Link from "next/link";
import { LocateFixed, Search, SlidersHorizontal, Star, X, ArrowDownUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { getCollections, getCuisines, getRestaurants, type Cuisine, type Restaurant } from "@/lib/skupApi";
import { restaurantPhoto } from "@/lib/lukmaUtils";
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
  const markerRefs=useRef<Map<string,import("leaflet").Marker>>(new Map());
  const [showFilters,setShowFilters]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [visibleCount,setVisibleCount]=useState(20);
  const [searchReady,setSearchReady]=useState(false);
  const [mapReady,setMapReady]=useState(false);
  const [searchAsMapMoves,setSearchAsMapMoves]=useState(true);
  const [mapPreviewOpen,setMapPreviewOpen]=useState(true);
  const [mapBounds,setMapBounds]=useState<{south:number;west:number;north:number;east:number}|null>(null);
  const searchAsMapMovesRef=useRef(true);
  const mapInteractionReadyRef=useRef(false);

  useEffect(()=>{
    let disposed=false;
    let map: import("leaflet").Map|undefined;
    let resizeObserver: ResizeObserver|null=null;
    let wheelHandler: ((event: WheelEvent)=>void)|null=null;
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
      setMapReady(true);
      resizeObserver=new ResizeObserver(()=>map?.invalidateSize());
      resizeObserver.observe(mapElementRef.current);
      wheelHandler=(event:WheelEvent)=>{
        if(!event.ctrlKey&&!event.metaKey)return;
        event.preventDefault();
        const delta=event.deltaY<0?1:-1;
        map?.setZoom(map.getZoom()+delta,{animate:false});
      };
      map.getContainer().addEventListener("wheel",wheelHandler,{passive:false});
      window.setTimeout(()=>map?.invalidateSize(),0);
      map.whenReady(()=>{
        map?.invalidateSize();
      });
      const onMoveEnd=()=>{
        const bounds=map?.getBounds();
        if(bounds && mapInteractionReadyRef.current && searchAsMapMovesRef.current) setMapBounds({
          south:bounds.getSouth(),
          west:bounds.getWest(),
          north:bounds.getNorth(),
          east:bounds.getEast(),
        });
      };
      map.on("moveend",onMoveEnd);

    });
    return ()=>{
      disposed=true;
      if(resizeObserver)resizeObserver.disconnect();
      if(map&&wheelHandler)map.getContainer().removeEventListener("wheel",wheelHandler);
      if(map) map.off("moveend");
      if(map){map.remove();}
      markerRefs.current.clear();
      leafletMapRef.current=null;
      markerLayerRef.current=null;
      setMapReady(false);
    };
  },[]);

  useEffect(()=>{
    searchAsMapMovesRef.current=searchAsMapMoves;
    if(searchAsMapMoves && leafletMapRef.current){
      const bounds=leafletMapRef.current.getBounds();
      setMapBounds({south:bounds.getSouth(),west:bounds.getWest(),north:bounds.getNorth(),east:bounds.getEast()});
    } else if(!searchAsMapMoves){
      setMapBounds(null);
    }
  },[searchAsMapMoves]);

  useEffect(()=>{
    if(!mapReady || restaurants.length<2 || !leafletMapRef.current) return;
    const coords=restaurants
      .map(item=>[Number(item.latitude),Number(item.longitude)] as [number,number])
      .filter(([lat,lng])=>Number.isFinite(lat)&&Number.isFinite(lng));
    if(coords.length>1){
      leafletMapRef.current.fitBounds(coords,{padding:[70,70],maxZoom:13.4,animate:false});
    }
  },[mapReady,restaurants]);

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
    setSearchReady(true);
    Promise.all([getCuisines(),getCollections(),getRestaurants({city:"თბილისი",page:1,limit:200})])
      .then(([c,col,r])=>{
        setCuisines((c||[]).sort((a,b)=>(a.name||"").localeCompare(b.name||"")));
        setCollections((col||[]).filter(x=>x.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        setRestaurants(r.data||[]);
        setSelected(r.data?.[0]?.id||"");      })
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
      if(searchAsMapMoves && mapBounds){
        const lat=Number(r.latitude),lng=Number(r.longitude);
        if(!Number.isFinite(lat)||!Number.isFinite(lng)) return false;
        if(lat<mapBounds.south||lat>mapBounds.north||lng<mapBounds.west||lng>mapBounds.east) return false;
      }
      return true;
    });
  },[restaurants,q,cuisineId,collectionId,collections,isOpen,minRating,discountOnly,priceLevel,dietary,searchAsMapMoves,mapBounds]);

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

  const selectRestaurant=useCallback((r:Restaurant,focusList=false)=>{
    setSelected(r.id);
    setMapPreviewOpen(true);
    if(focusList){
      const index=sorted.findIndex(item=>item.id===r.id);
      if(index>=visibleCount){
        setVisibleCount(Math.min(sorted.length,Math.ceil((index+1)/20)*20));
      }
    }
    const lat=Number(r.latitude);
    const lng=Number(r.longitude);
    if(leafletMapRef.current && Number.isFinite(lat) && Number.isFinite(lng)){
      leafletMapRef.current.flyTo([lat,lng],Math.max(leafletMapRef.current.getZoom(),14.8),{duration:.45});
    }
    if(focusList){
      window.requestAnimationFrame(()=>{
        window.requestAnimationFrame(()=>{
          const target=Array.from(document.querySelectorAll<HTMLElement>("[data-restaurant-id]"))
            .find(node=>node.dataset.restaurantId===r.id);
          target?.scrollIntoView({behavior:"smooth",block:"nearest"});
        });
      });
    }
  },[sorted,visibleCount]);

  useEffect(()=>{
    let disposed=false;
    const paintMarkers=async()=>{
      const map=leafletMapRef.current;
      const layer=markerLayerRef.current;
      if(!map || !layer)return;
      const L=await import("leaflet");
      if(disposed)return;
      layer.clearLayers();
      markerRefs.current.clear();
      sorted.slice(0,120).forEach(r=>{
        const lat=Number(r.latitude),lng=Number(r.longitude);
        if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
        const selectedMarker=r.id===selected;
        const discount=Number(r.discountPercent||0);
        const photo=restaurantPhoto(r).replace(/"/g,"&quot;");
        const marker=L.marker([lat,lng],{
          icon:L.divIcon({
            className:"lukma-map-marker-wrap",
                        html:'<button class="lukma-map-marker '+(selectedMarker?'selected':'')+'" type="button"><span class="marker-photo" style="background-image:url(&quot;'+photo+'&quot;)"></span><span class="marker-rating">'+Number(r.ratingAvg||0).toFixed(1)+(discount?' · '+discount+'% OFF':"")+'</span></button>',
            iconSize:[52,46],
            iconAnchor:[26,23],
          }),
          keyboard:true,
          title:r.name,
          alt:r.name,
        });
        marker.on("click",()=>selectRestaurant(r,true));
        marker.addTo(layer);
        markerRefs.current.set(r.id,marker);
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
  },[mapReady,sorted,userLocation,selectRestaurant]);

  useEffect(()=>{
    markerRefs.current.forEach((marker,id)=>{
      const element=marker.getElement()?.querySelector(".lukma-map-marker");
      const isSelected=id===selected;
      element?.classList.toggle("selected",isSelected);
      marker.setZIndexOffset(isSelected?1000:0);
    });
  },[selected]);

  const toggleNearMe=()=>{
    if(nearMe){
      setNearMe(false);
      setUserLocation(null);
      if(sort==="distance")setSort("rating");
      return;
    }
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
    setQ("");setCuisineId("");setCollectionId("");setIsOpen(false);setMinRating("");setDiscountOnly(false);setPriceLevel("");setDietary([]);setNearMe(false);setUserLocation(null);setSort("rating");
  };
  const resetMap=()=>{
    setSearchAsMapMoves(true);
    leafletMapRef.current?.flyTo([41.7151,44.8271],12.4,{duration:.5});
  };

  const surprise=()=>{if(!sorted.length)return;const r=sorted[Math.floor(Math.random()*sorted.length)];selectRestaurant(r);};

  return <div className="skup-site discover-app">
    <SkupHeader searchValue={q} onSearchChange={setQ} activeNav="discover"/>
    <main className="discover-page">
      <section className="discover-head shell">
        <div className="discover-head-copy">
          <div className="discover-head-line">
            <div>
              <span className="kicker">Discover</span>
              <h1>Discover Restaurants</h1>
              <p>Find the best dining experiences near you.</p>
            </div>
            <strong className="discover-count-top">{sorted.length} places</strong>
          </div>
        </div>
      </section>

      <section className="discover-toolbar shell">
        <div className="discover-filter-scroll">
          <button className="filter-chip location-chip" onClick={resetMap}><LocateFixed size={14}/> Tbilisi <span className="chip-caret">⌄</span></button>
          <button className={"filter-chip "+(cuisineId?"active":"")} onClick={()=>setShowFilters(v=>!v)}>{cuisineId ? (cuisines.find(c=>c.id===cuisineId)?.name || "Cuisine") : "All cuisines"} <span className="chip-caret">⌄</span></button>
          <button className={"filter-chip "+(priceLevel?"active":"")} onClick={()=>setPriceLevel(priceLevel==="3" ? "" : String(Number(priceLevel||0)+1))}>₾ Price <span className="chip-caret">⌄</span></button>
          <button className={"filter-chip "+(minRating?"active":"")} onClick={()=>setMinRating(minRating ? "" : "4")}><Star size={13} fill="currentColor"/> {minRating ? minRating+"+" : "Rating"} <span className="chip-caret">⌄</span></button>
          <button className={"filter-chip "+(isOpen?"active":"")} onClick={()=>setIsOpen(v=>!v)}><span className={"filter-dot "+(isOpen?"on":"")}></span> Open now</button>
          <button className={"filter-icon-button "+(showFilters?"active":"")} onClick={()=>setShowFilters(v=>!v)} aria-label="More filters"><SlidersHorizontal size={16}/></button>
        </div>
        <div className="discover-toolbar-right">
          <button className="sort-button" onClick={()=>setSort(sort==="rating"?"name":sort==="name"?"discount":sort==="discount"?(nearMe?"distance":"rating"):"rating")}><ArrowDownUp size={13}/>{sort==="rating"?"Rating":sort==="name"?"Name":sort==="discount"?"Offers":"Distance"}</button>
        </div>
      </section>

      {showFilters?<section className="discover-filter-panel shell">
        <div><span className="filter-panel-label">Cuisine</span><div className="filter-options">{cuisines.map(c=><button key={c.id} className={cuisineId===c.id?"selected":""} onClick={()=>setCuisineId(cuisineId===c.id?"":c.id)}>{c.icon||"•"} {c.name}</button>)}</div></div>
        <div><span className="filter-panel-label">Price</span><div className="filter-options">{["1","2","3"].map(v=><button key={v} className={priceLevel===v?"selected":""} onClick={()=>setPriceLevel(priceLevel===v?"":v)}>{"₾".repeat(Number(v))} <small>{v==="1"?"Everyday":v==="2"?"Mid-range":"Premium"}</small></button>)}</div></div>
        <div><span className="filter-panel-label">Dietary</span><div className="filter-options">{Object.keys(DIETARY).map(v=><button key={v} className={dietary.includes(v)?"selected":""} onClick={()=>setDietary(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}>{v==="vegan"?"🌱":v==="vegetarian"?"🥗":v==="halal"?"☪️":v==="glutenfree"?"🌾":"🦐"} {v}</button>)}</div></div>
      </section>:null}

      {error?<div className="shell inline-error discover-error">{error}</div>:null}

      <section className="discover-layout shell" id="map">
        <aside className="discover-list">
          <div className="discover-results-head"><span><strong>{sorted.length}</strong> places</span><span className="discover-results-hint">Scroll to explore</span></div>
          {loading ? <div className="discover-loading-list">{Array.from({length:4}).map((_,i)=><div key={i} className="discover-card-skeleton"/>)}</div> :
            visible.length ? <div className="discover-cards">
              {visible.map(r=>{
                const distance = userLocation ? distanceKm(userLocation.lat,userLocation.lng,Number(r.latitude),Number(r.longitude)) : null;
                return <article key={r.id} data-restaurant-id={r.id} onMouseEnter={()=>{setSelected(r.id);setMapPreviewOpen(true)}} onClick={()=>selectRestaurant(r)} className={"discover-card-wrap "+(r.id===selectedRestaurant?.id?"selected":"")}>
                  <div className="discover-card-photo">
                    <img src={restaurantPhoto(r)} alt="" loading="lazy"/>
                    {r.discountPercent ? <span className="discover-card-deal">-{r.discountPercent}%</span> : null}
                    <Link href={"/favorites/"} className="discover-card-heart" aria-label="Favorites" onClick={e=>e.stopPropagation()}><HeartMini/></Link>
                  </div>
                  <div className="discover-card-body">
                    <div className="discover-card-title-row">
                      <h3>{r.name}</h3>
                      <span className="discover-card-rating"><Star size={12} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)} <small>({r.reviewsCount || 0})</small></span>
                    </div>
                    <div className="discover-card-meta">
                      <span>{r.cuisine?.name || "Restaurant"}</span><span>·</span><span>{"₾".repeat(Math.max(1,Math.min(3,Number((r as any).priceLevel)||1)))}</span>{distance !== null ? <><span>·</span><span>{distance.toFixed(1)} km</span></> : null}
                    </div>
                    {r.description ? <p>{r.description}</p> : <p>{r.address}</p>}
                    <div className="discover-card-tags">
                      {r.cuisine?.name ? <span>{r.cuisine.name}</span> : null}
                      {r.district ? <span>{r.district}</span> : null}
                      {r.discountPercent ? <span className="deal-tag">Offer</span> : null}
                    </div>
                    <div className="discover-card-bottom">
                      <span className={"discover-open-state "+(r.isOpen?"open":"closed")}><i></i>{r.isOpen?"Open":"Closed"}{r.isOpen && r.workingHours?.find(h=>h.day===new Date().getDay())?.close ? <> · Closes {r.workingHours.find(h=>h.day===new Date().getDay())?.close}</> : null}</span>
                      <Link className="discover-view" href={"/restaurant/?id="+encodeURIComponent(r.id)} onClick={e=>e.stopPropagation()}>View</Link>
                    </div>
                  </div>
                </article>;
              })}
            </div> :
            <div className="discover-empty"><Search size={28}/><h3>Nothing found</h3><p>Change your search or filters and try again.</p><button className="green-btn" onClick={clearFilters}>Clear filters</button></div>}
          {visible.length<sorted.length?<button className="discover-load-more" onClick={()=>setVisibleCount(v=>v+20)}>Show more · {sorted.length-visible.length} left</button>:null}
          </aside>

        <div className="discover-map-card">
          <div ref={mapElementRef} className="discover-map-canvas" aria-label="Interactive Tbilisi restaurant map"/>
          <div className="map-overlay-top">
            <button className={"map-search-toggle "+(searchAsMapMoves?"checked":"")} type="button" onClick={()=>setSearchAsMapMoves(v=>!v)} aria-pressed={searchAsMapMoves}>
              <span className="map-toggle-box">{searchAsMapMoves?"✓":""}</span> Search as I move
            </button>
          </div>
          <div className="map-controls">
            <button onClick={()=>leafletMapRef.current?.zoomIn()} aria-label="Zoom in">+</button>
            <button onClick={()=>leafletMapRef.current?.zoomOut()} aria-label="Zoom out">−</button>
            <button onClick={resetMap} aria-label="Reset map"><LocateFixed size={15}/></button>
          </div>
          {selectedRestaurant && mapPreviewOpen?<div className="map-selected-card map-focus-card">
            <button className="map-focus-close" aria-label="Close preview" onClick={()=>setMapPreviewOpen(false)}><X size={15}/></button>
            <img src={restaurantPhoto(selectedRestaurant)} alt=""/>
            <div className="map-focus-copy">
              <strong>{selectedRestaurant.name}</strong>
              <span>{selectedRestaurant.cuisine?.name||"Restaurant"} · {selectedRestaurant.district||selectedRestaurant.city}</span>
              <small><Star size={11} fill="currentColor"/> {Number(selectedRestaurant.ratingAvg||0).toFixed(1)} ({selectedRestaurant.reviewsCount || 0})</small>
              <span className={"map-focus-open "+(selectedRestaurant.isOpen?"open":"closed")}><i></i>{selectedRestaurant.isOpen?"Open now":"Closed"}</span>
              <Link href={"/restaurant/?id="+encodeURIComponent(selectedRestaurant.id)} className="map-focus-button">View details</Link>
            </div>
          </div>:null}

          <div className="map-bottom-strip" aria-label="Restaurant map selection">
            <button className="map-strip-arrow left" onClick={()=>{const nextIndex=Math.max(0,sorted.findIndex(r=>r.id===selectedRestaurant?.id)-1);if(sorted[nextIndex])selectRestaurant(sorted[nextIndex]);}} aria-label="Previous restaurant">‹</button>
            <div className="map-strip-scroll">
              {[...sorted.slice(0,7),...(selectedRestaurant && !sorted.slice(0,7).some(item=>item.id===selectedRestaurant.id)?[selectedRestaurant]:[])].slice(0,8).map(r=><button key={r.id} className={"map-strip-card "+(r.id===selectedRestaurant?.id?"selected":"")} onClick={()=>selectRestaurant(r)}>
                <img src={restaurantPhoto(r)} alt=""/>
                <span>{r.name}</span>
                <small><Star size={10} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)} ({r.reviewsCount || 0})</small>
              </button>)}
            </div>
            <button className="map-strip-arrow right" onClick={()=>{const nextIndex=Math.min(sorted.length-1,sorted.findIndex(r=>r.id===selectedRestaurant?.id)+1);if(sorted[nextIndex])selectRestaurant(sorted[nextIndex]);}} aria-label="Next restaurant">›</button>
          </div>
        </div>
      </section>

      {collections.length?<section id="collections" className="section section-soft discover-collections"><div className="shell"><div className="section-head"><div><span className="kicker">Curated</span><h2>Collections</h2></div></div><div className="collection-grid">{collections.slice(0,6).map(c=><Link key={c.id} href={"/discover/?collection="+encodeURIComponent(c.id)} className="collection-card" style={{background:c.bg}}><div className="collection-glow" style={{background:c.accent}}/><div className="collection-copy"><span>{c.emoji}</span><h3>{c.titleKa}</h3><p>{c.subtitle}</p></div></Link>)}</div></div></section>:null}
    </main>
  </div>;

function HeartMini(){return <span className="discover-heart-glyph">♡</span>}
}
