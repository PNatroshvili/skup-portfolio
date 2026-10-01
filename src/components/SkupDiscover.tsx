"use client";

import Link from "next/link";
import { LocateFixed, Search, SlidersHorizontal, Star, X, ArrowDownUp, ChevronDown } from "lucide-react";
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
  type FilterMenu = "location"|"cuisine"|"price"|"rating"|"more"|"sort"|null;
  const [openMenu,setOpenMenu]=useState<FilterMenu>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [visibleCount,setVisibleCount]=useState(20);
  const [searchReady,setSearchReady]=useState(false);
  const [mapReady,setMapReady]=useState(false);
  const [searchAsMapMoves,setSearchAsMapMoves]=useState(true);
  const [mapPreviewOpen,setMapPreviewOpen]=useState(true);
  const [mapBounds,setMapBounds]=useState<{south:number;west:number;north:number;east:number}|null>(null);
  const [mapRenderVersion,setMapRenderVersion]=useState(0);
  const searchAsMapMovesRef=useRef(true);
  const mapInteractionReadyRef=useRef(false);
  const mapUserInteractedRef=useRef(false);
  const toolbarRef=useRef<HTMLDivElement|null>(null);

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
      const onUserMapInteraction=()=>{mapUserInteractedRef.current=true;};
      const onMoveEnd=()=>{
        const bounds=map?.getBounds();
        if(bounds && mapInteractionReadyRef.current && mapUserInteractedRef.current && searchAsMapMovesRef.current) setMapBounds({
          south:bounds.getSouth(),
          west:bounds.getWest(),
          north:bounds.getNorth(),
          east:bounds.getEast(),
        });
      };
      map.on("moveend",onMoveEnd);
      map.on("dragstart zoomstart",onUserMapInteraction);
      map.on("zoomend moveend",()=>setMapRenderVersion(v=>v+1));

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
    if(searchAsMapMoves && leafletMapRef.current && mapInteractionReadyRef.current){
      const bounds=leafletMapRef.current.getBounds();
      setMapBounds({south:bounds.getSouth(),west:bounds.getWest(),north:bounds.getNorth(),east:bounds.getEast()});
    } else if(!searchAsMapMoves){
      setMapBounds(null);
    } else if(!mapUserInteractedRef.current){
      setMapBounds(null);
    }
  },[searchAsMapMoves]);

  useEffect(()=>{
    if(!mapReady || restaurants.length<2 || !leafletMapRef.current) return;
    const coords=restaurants
      .map(item=>[Number(item.latitude),Number(item.longitude)] as [number,number])
      .filter(([lat,lng])=>Number.isFinite(lat)&&Number.isFinite(lng));
    if(coords.length>1){
      mapInteractionReadyRef.current=false;
      leafletMapRef.current.fitBounds(coords,{padding:[56,56],maxZoom:14,animate:false});
      window.setTimeout(()=>{mapInteractionReadyRef.current=true;},350);
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
      if(priceLevel){
        const level=(r.priceLevel || (Number(r.avgMenuPrice||NaN)<15?"1":Number(r.avgMenuPrice||NaN)<30?"2":Number.isFinite(Number(r.avgMenuPrice))?"3":"" )) as string;
        if(level!==priceLevel)return false;
      }
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

      const candidates=sorted.slice(0,120).map(r=>{
        const lat=Number(r.latitude),lng=Number(r.longitude);
        return {restaurant:r,lat,lng,point:Number.isFinite(lat)&&Number.isFinite(lng)?map.latLngToContainerPoint([lat,lng]):null};
      }).filter((item):item is {restaurant:Restaurant;lat:number;lng:number;point:import("leaflet").Point}=>Boolean(item.point));

      const selectedItem=candidates.find(item=>item.restaurant.id===selected);
      const rest=candidates.filter(item=>item.restaurant.id!==selected);
      const clusters:{items:typeof rest;point:import("leaflet").Point}[]=[];
      const threshold=42;

      rest.forEach(item=>{
        const existing=clusters.find(cluster=>cluster.point.distanceTo(item.point)<=threshold);
        if(existing){
          existing.items.push(item);
          const count=existing.items.length;
          existing.point=existing.items.reduce((acc,next)=>acc.add(next.point),new L.Point(0,0)).divideBy(count);
        } else {
          clusters.push({items:[item],point:item.point});
        }
      });

      const addRestaurantMarker=(r:Restaurant,forceSelected=false)=>{
        const lat=Number(r.latitude),lng=Number(r.longitude);
        const discount=Number(r.discountPercent||0);
        const photo=restaurantPhoto(r).replace(/"/g,"&quot;");
        const marker=L.marker([lat,lng],{
          icon:L.divIcon({
            className:"lukma-map-marker-wrap",
            html:'<button class="lukma-map-marker '+(forceSelected?'selected':'')+'" type="button" aria-label="'+r.name.replace(/"/g,"&quot;")+'"><span class="marker-photo" style="background-image:url(&quot;'+photo+'&quot;)"></span><span class="marker-rating">'+Number(r.ratingAvg||0).toFixed(1)+(discount?' · '+discount+'% OFF':"")+'</span></button>',
            iconSize:forceSelected?[50,49]:[44,42],
            iconAnchor:forceSelected?[25,24.5]:[22,21],
          }),
          keyboard:true,
          title:r.name,
          alt:r.name,
        });
        marker.on("click",()=>selectRestaurant(r,true));
        marker.addTo(layer);
        markerRefs.current.set(r.id,marker);
      };

      clusters.forEach(cluster=>{
        if(cluster.items.length===1){
          addRestaurantMarker(cluster.items[0].restaurant);
          return;
        }
        const lat=cluster.items.reduce((sum,item)=>sum+item.lat,0)/cluster.items.length;
        const lng=cluster.items.reduce((sum,item)=>sum+item.lng,0)/cluster.items.length;
        const rating=(cluster.items.reduce((sum,item)=>sum+Number(item.restaurant.ratingAvg||0),0)/cluster.items.length).toFixed(1);
        const marker=L.marker([lat,lng],{
          icon:L.divIcon({
            className:"lukma-map-cluster-wrap",
            html:'<button class="lukma-map-cluster" type="button" aria-label="'+cluster.items.length+' restaurants"><strong>'+cluster.items.length+'</strong><span>'+rating+'</span></button>',
            iconSize:[46,46],
            iconAnchor:[23,23],
          }),
          keyboard:true,
          title:cluster.items.length+" restaurants",
          alt:cluster.items.length+" restaurants",
        });
        marker.on("click",()=>{
          const nextZoom=Math.min(18,map.getZoom()+2);
          map.flyTo([lat,lng],nextZoom,{duration:.35});
        });
        marker.addTo(layer);
      });

      if(selectedItem)addRestaurantMarker(selectedItem.restaurant,true);

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
  },[mapReady,mapRenderVersion,sorted,userLocation,selectRestaurant,selected]);
 
  useEffect(()=>{
    markerRefs.current.forEach((marker,id)=>{
      marker.setZIndexOffset(id===selected?1000:0);
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
    setQ("");setCuisineId("");setCollectionId("");setIsOpen(false);setMinRating("");setDiscountOnly(false);setPriceLevel("");setDietary([]);setNearMe(false);setUserLocation(null);setSort("rating");setOpenMenu(null);
  };
  const resetMap=()=>{
    mapUserInteractedRef.current=false;
    setMapBounds(null);
    setNearMe(false);
    setUserLocation(null);
    setSort("rating");
    setSearchAsMapMoves(true);
    setOpenMenu(null);
    leafletMapRef.current?.flyTo([41.7151,44.8271],12.4,{duration:.5});
  };

  const surprise=()=>{if(!sorted.length)return;const r=sorted[Math.floor(Math.random()*sorted.length)];selectRestaurant(r);setOpenMenu(null);};

  useEffect(()=>{
    const closeOnOutside=(event:MouseEvent)=>{
      if(!toolbarRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpenMenu(null);};
    document.addEventListener("mousedown",closeOnOutside);
    document.addEventListener("keydown",onKey);
    return()=>{document.removeEventListener("mousedown",closeOnOutside);document.removeEventListener("keydown",onKey);};
  },[]);

  const stripScrollRef=useRef<HTMLDivElement|null>(null);
  const stripDragRef=useRef({active:false,startX:0,scrollLeft:0,moved:false});

  const handleStripPointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(event.pointerType==="mouse" && event.button!==0 && event.button!==2)return;
    const el=stripScrollRef.current;
    if(!el)return;
    stripDragRef.current={active:true,startX:event.clientX,scrollLeft:el.scrollLeft,moved:false};
    el.setPointerCapture?.(event.pointerId);
  };

  const handleStripPointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    const state=stripDragRef.current;
    const el=stripScrollRef.current;
    if(!state.active || !el)return;
    const delta=event.clientX-state.startX;
    if(Math.abs(delta)>5)state.moved=true;
    if(state.moved){
      event.preventDefault();
      el.scrollLeft=state.scrollLeft-delta;
    }
  };

  const handleStripPointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{
    const el=stripScrollRef.current;
    stripDragRef.current.active=false;
    try{el?.releasePointerCapture?.(event.pointerId);}catch{}
    if(stripDragRef.current.moved){
      window.setTimeout(()=>{stripDragRef.current.moved=false;},0);
    }
  };

  const handleStripClick=(event:React.MouseEvent<HTMLDivElement>)=>{
    if(stripDragRef.current.moved){
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const scrollStrip=(direction:number)=>{
    stripScrollRef.current?.scrollBy({
      left:direction*Math.max(260,stripScrollRef.current.clientWidth*.92),
      behavior:"smooth"
    });
  };

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

      <section className="discover-toolbar shell" ref={toolbarRef}>
        <div className="discover-filter-scroll">
          <div className="filter-menu-wrap">
            <button className={"filter-chip dropdown-chip location-chip "+(nearMe?"active":"")} onClick={()=>setOpenMenu(openMenu==="location"?null:"location")} aria-expanded={openMenu==="location"}><LocateFixed size={14}/> <span>{nearMe?"Near me":"Tbilisi"}</span> <ChevronDown className="chip-caret" size={12}/></button>
            {openMenu==="location"?<div className="filter-popover location-popover">
              <span className="filter-popover-title">Location</span>
              <button className={!nearMe?"selected":""} onClick={resetMap}><LocateFixed size={14}/><span>Tbilisi</span>{!nearMe?<span className="popover-check">✓</span>:null}</button>
              <button className={nearMe?"selected":""} onClick={toggleNearMe}><LocateFixed size={14}/><span>Near me</span>{nearMe?<span className="popover-check">✓</span>:null}</button>
            </div>:null}
          </div>

          <div className="filter-menu-wrap">
            <button className={"filter-chip dropdown-chip "+(cuisineId?"active":"")} onClick={()=>setOpenMenu(openMenu==="cuisine"?null:"cuisine")} aria-expanded={openMenu==="cuisine"}>{cuisineId ? (cuisines.find(c=>c.id===cuisineId)?.name || "Cuisine") : "All cuisines"} <ChevronDown className="chip-caret" size={12}/></button>
            {openMenu==="cuisine"?<div className="filter-popover cuisine-popover">
              <div className="filter-popover-head"><span className="filter-popover-title">Cuisine</span><button onClick={()=>{setCuisineId("");setOpenMenu(null)}}>Clear</button></div>
              <div className="filter-popover-options">{cuisines.map(c=><button key={c.id} className={cuisineId===c.id?"selected":""} onClick={()=>{setCuisineId(cuisineId===c.id?"":c.id);setOpenMenu(null)}}>{c.icon||"•"}<span>{c.name}</span></button>)}</div>
            </div>:null}
          </div>

          <div className="filter-menu-wrap">
            <button className={"filter-chip dropdown-chip "+(priceLevel?"active":"")} onClick={()=>setOpenMenu(openMenu==="price"?null:"price")} aria-expanded={openMenu==="price"}><span>{priceLevel?"₾".repeat(Number(priceLevel))+" Price":"₾ Price"}</span> <ChevronDown className="chip-caret" size={12}/></button>
            {openMenu==="price"?<div className="filter-popover">
              <div className="filter-popover-head"><span className="filter-popover-title">Price level</span><button onClick={()=>{setPriceLevel("");setOpenMenu(null)}}>Clear</button></div>
              <div className="filter-popover-options">{["1","2","3"].map(v=><button key={v} className={priceLevel===v?"selected":""} onClick={()=>{setPriceLevel(priceLevel===v?"":v);setOpenMenu(null)}}><strong>{"₾".repeat(Number(v))}</strong><span>{v==="1"?"Everyday":v==="2"?"Mid-range":"Premium"}</span></button>)}</div>
            </div>:null}
          </div>

          <div className="filter-menu-wrap">
            <button className={"filter-chip dropdown-chip "+(minRating?"active":"")} onClick={()=>setOpenMenu(openMenu==="rating"?null:"rating")} aria-expanded={openMenu==="rating"}><Star size={13} fill="currentColor"/> <span>{minRating ? minRating+"+" : "Rating"}</span> <ChevronDown className="chip-caret" size={12}/></button>
            {openMenu==="rating"?<div className="filter-popover">
              <div className="filter-popover-head"><span className="filter-popover-title">Minimum rating</span><button onClick={()=>{setMinRating("");setOpenMenu(null)}}>Clear</button></div>
              <div className="filter-popover-options rating-options">{["3","3.5","4","4.5"].map(v=><button key={v} className={minRating===v?"selected":""} onClick={()=>{setMinRating(minRating===v?"":v);setOpenMenu(null)}}><Star size={13} fill="currentColor"/><span>{v}+</span></button>)}</div>
            </div>:null}
          </div>

          <button className={"filter-chip "+(isOpen?"active":"")} onClick={()=>{setIsOpen(v=>!v);setOpenMenu(null)}}><span className={"filter-dot "+(isOpen?"on":"")}></span> Open now</button>

          <div className="filter-menu-wrap">
            <button className={"filter-icon-button "+(openMenu==="more"?"active":"")} onClick={()=>setOpenMenu(openMenu==="more"?null:"more")} aria-label="More filters" aria-expanded={openMenu==="more"}><SlidersHorizontal size={16}/></button>
            {openMenu==="more"?<div className="filter-popover more-popover">
              <div className="filter-popover-head"><span className="filter-popover-title">More filters</span><button onClick={clearFilters}>Clear all</button></div>
              <div className="popover-section"><span className="filter-popover-label">Dietary</span><div className="filter-popover-options multi">{Object.keys(DIETARY).map(v=><button key={v} className={dietary.includes(v)?"selected":""} onClick={()=>setDietary(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}>{v==="vegan"?"🌱":v==="vegetarian"?"🥗":v==="halal"?"☪️":v==="glutenfree"?"🌾":"🦐"}<span>{v}</span></button>)}</div></div>
              <div className="popover-section"><span className="filter-popover-label">Offers</span><button className={"popover-toggle "+(discountOnly?"selected":"")} onClick={()=>setDiscountOnly(v=>!v)}><span className="filter-dot on"></span><span>Restaurants with offers</span>{discountOnly?<span className="popover-check">✓</span>:null}</button></div>
            </div>:null}
          </div>
        </div>

        <div className="discover-toolbar-right">
          <div className="filter-menu-wrap">
            <button className="sort-button" onClick={()=>setOpenMenu(openMenu==="sort"?null:"sort")} aria-expanded={openMenu==="sort"}><ArrowDownUp size={13}/>{sort==="rating"?"Rating":sort==="name"?"Name":sort==="discount"?"Offers":"Distance"}<ChevronDown className="chip-caret" size={11}/></button>
            {openMenu==="sort"?<div className="filter-popover sort-popover">
              <span className="filter-popover-title">Sort by</span>
              {(nearMe ? (["rating","name","discount","distance"] as const) : (["rating","name","discount"] as const)).map(v=><button key={v} className={sort===v?"selected":""} onClick={()=>{setSort(v);setOpenMenu(null)}}>{v==="rating"?"Rating":v==="name"?"Name":v==="discount"?"Offers":"Distance"}{sort===v?<span className="popover-check">✓</span>:null}</button>)}
            </div>:null}
          </div>
        </div>
      </section>

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
            <button className="map-strip-arrow left" onClick={()=>scrollStrip(-1)} aria-label="Scroll restaurants left">‹</button>
            <div
              ref={stripScrollRef}
              className="map-strip-scroll"
              onPointerDown={handleStripPointerDown}
              onPointerMove={handleStripPointerMove}
              onPointerUp={handleStripPointerUp}
              onPointerCancel={handleStripPointerUp}
              onClick={handleStripClick}
              onContextMenu={event=>event.preventDefault()}
            >
              {sorted.map(r=>{
                const tags=[r.cuisine?.name,r.district,r.discountPercent?"Offer":""].filter(Boolean).slice(0,2);
                return <button key={r.id} className={"map-strip-card "+(r.id===selectedRestaurant?.id?"selected":"")} onClick={()=>selectRestaurant(r)}>
                  <img src={restaurantPhoto(r)} alt="" draggable={false}/>
                  <div className="map-strip-copy">
                    <div className="map-strip-title">{r.name}</div>
                    <small><Star size={11} fill="currentColor"/> {Number(r.ratingAvg||0).toFixed(1)} <span>({r.reviewsCount || 0})</span></small>
                    <div className="map-strip-tags">{tags.map((tag,i)=><span key={i}>{tag}</span>)}</div>
                  </div>
                </button>;
              })}
            </div>
            <button className="map-strip-arrow right" onClick={()=>scrollStrip(1)} aria-label="Scroll restaurants right">›</button>
          </div>
        </div>
      </section>

      {collections.length?<section id="collections" className="section section-soft discover-collections"><div className="shell"><div className="section-head"><div><span className="kicker">Curated</span><h2>Collections</h2></div></div><div className="collection-grid">{collections.slice(0,6).map(c=><Link key={c.id} href={"/discover/?collection="+encodeURIComponent(c.id)} className="collection-card" style={{background:c.bg}}><div className="collection-glow" style={{background:c.accent}}/><div className="collection-copy"><span>{c.emoji}</span><h3>{c.titleKa}</h3><p>{c.subtitle}</p></div></Link>)}</div></div></section>:null}
    </main>
  </div>;

function HeartMini(){return <span className="discover-heart-glyph">♡</span>}
}
