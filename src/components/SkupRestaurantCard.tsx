"use client";

import Link from "next/link";
import { Clock3, MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/skupApi";
import { restaurantPhoto } from "@/lib/lukmaUtils";

export default function RestaurantCard({
  restaurant,
  compact = false,
  selected = false,
  onHover,
}: {
  restaurant: Restaurant;
  compact?: boolean;
  selected?: boolean;
  onHover?: () => void;
}) {
  return (
    <Link
      href={"/restaurant/?id=" + encodeURIComponent(restaurant.id)}
      className={"restaurant-card " + (compact ? "compact " : "") + (selected ? "is-selected" : "")}
      onMouseEnter={onHover}
    >
      <div className="restaurant-photo-wrap">
        <img src={restaurantPhoto(restaurant)} alt="" className="restaurant-photo" loading="lazy" />
        {restaurant.discountPercent ? <span className="restaurant-deal">-{restaurant.discountPercent}%</span> : null}
      </div>
      <div className="restaurant-card-body">
        <div className="restaurant-card-title-row">
          <h3>{restaurant.name}</h3>
          <span className="restaurant-rating"><Star size={12} fill="currentColor" /> {Number(restaurant.ratingAvg || 0).toFixed(1)}</span>
        </div>
        <div className="restaurant-meta"><span>{restaurant.cuisine?.name || "Restaurant"}</span><span>·</span><span>{restaurant.district || restaurant.city}</span></div>
        <div className="restaurant-card-context"><span>{restaurant.priceLevel ? "₾".repeat(Number(restaurant.priceLevel)) : Number.isFinite(Number(restaurant.avgMenuPrice)) ? "≈ ₾" + Number(restaurant.avgMenuPrice).toFixed(0) : "Price on menu"}</span><span className={"restaurant-open-mini " + (restaurant.isOpen ? "open" : "closed")}><i></i>{restaurant.isOpen ? "Open now" : "Closed"}</span></div>
        {!compact ? (
          <div className="restaurant-bottom-meta"><span><MapPin size={12} /> {restaurant.address}</span>{restaurant.reviewsCount > 0 ? <span>{restaurant.reviewsCount} reviews</span> : null}</div>
        ) : null}
      </div>
    </Link>
  );
}
