"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/skupApi";

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
        {restaurant.cover_photo ? <img src={restaurant.cover_photo} alt="" className="restaurant-photo" loading="lazy" /> : <div className="restaurant-photo-placeholder">ლუკმა</div>}
        {restaurant.discountPercent ? <span className="restaurant-deal">-{restaurant.discountPercent}%</span> : null}
      </div>
      <div className="restaurant-card-body">
        <div className="restaurant-card-title-row">
          <h3>{restaurant.name}</h3>
          <span className="restaurant-rating"><Star size={12} fill="currentColor" /> {Number(restaurant.ratingAvg || 0).toFixed(1)}</span>
        </div>
        <div className="restaurant-meta"><span>{restaurant.cuisine?.name || "რესტორანი"}</span><span>·</span><span>{restaurant.district || restaurant.city}</span></div>
        {!compact ? (
          <div className="restaurant-bottom-meta"><span><MapPin size={12} /> {restaurant.address}</span>{restaurant.reviewsCount > 0 ? <span>{restaurant.reviewsCount} მიმოხილვა</span> : null}</div>
        ) : null}
      </div>
    </Link>
  );
}
