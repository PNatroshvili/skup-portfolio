import type { Restaurant } from "./skupApi";

export const LUKMA_PHOTOS = {
  georgian: "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
  italian: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200",
  japanese: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200",
  american: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200",
  pub: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200",
  mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
} as const;

export function restaurantPhoto(restaurant: Restaurant): string {
  return (
    restaurant.cover_photo ||
    restaurant.photos?.find(photo => photo.isCover)?.url ||
    restaurant.photos?.[0]?.url ||
    LUKMA_PHOTOS[(restaurant.cuisine?.slug || "georgian") as keyof typeof LUKMA_PHOTOS] ||
    LUKMA_PHOTOS.georgian
  );
}

const RECENT_KEY = "lukma_recent_restaurants_v1";

export function readRecentlyViewed(): Restaurant[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as Restaurant[]) : [];
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(restaurant: Restaurant) {
  try {
    const current = readRecentlyViewed().filter(item => item.id !== restaurant.id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([restaurant, ...current].slice(0, 12)));
  } catch {}
}

export function clearRecentlyViewed() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

function tbilisiNowParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tbilisi",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find(part => part.type === "hour")?.value || 0);
  const weekday = parts.find(part => part.type === "weekday")?.value || "";
  return { hour, weekend: weekday === "Sat" || weekday === "Sun" };
}

function tbilisiBookingTimestamp(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - 4 * 60 * 60 * 1000;
}

export function estimateWaitTime(restaurant: Restaurant): number | null {
  if (!restaurant.isOpen) return null;
  const { hour, weekend } = tbilisiNowParts();
  const peak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
  const base = peak ? (weekend ? 30 : 20) : (weekend ? 15 : 5);
  return Math.max(5, base + ((restaurant.id.charCodeAt(0) % 10) - 5));
}

export function addBookingToCalendar(booking: {
  id: string;
  date: string;
  time: string;
  restaurantName: string;
  address?: string;
  guests: number;
}) {
  const startTimestamp = tbilisiBookingTimestamp(booking.date, booking.time);
  const endTimestamp = startTimestamp + 90 * 60 * 1000;
  const format = (timestamp: number) => {
    const value = new Date(timestamp);
    const pad = (n: number) => String(n).padStart(2, "0");
    return value.getUTCFullYear() + pad(value.getUTCMonth() + 1) + pad(value.getUTCDate()) + "T" + pad(value.getUTCHours()) + pad(value.getUTCMinutes()) + "00Z";
  };
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LUKMA//Restaurant Booking//EN",
    "BEGIN:VEVENT",
    "UID:" + booking.id + "@lukma.skup.ge",
    "DTSTAMP:" + format(Date.now()),
    "DTSTART:" + format(startTimestamp),
    "DTEND:" + format(endTimestamp),
    "SUMMARY:LUKMA · " + booking.restaurantName,
    "LOCATION:" + (booking.address || ""),
    "DESCRIPTION:" + booking.guests + " guests · LUKMA booking #" + booking.id.slice(0, 8).toUpperCase(),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lukma-" + booking.date + "-" + booking.time.replace(":", "") + ".ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function bookingQrUrl(payload: Record<string, unknown>) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=" + encodeURIComponent(JSON.stringify(payload));
}

export function bookingCountdown(date: string, time: string) {
  const target = tbilisiBookingTimestamp(date, time);
  const diff = target - Date.now();
  if (diff <= 0) return "Now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return days > 0 ? days + "d " + hours + "h" : hours > 0 ? hours + "h " + minutes + "m" : minutes + "m";
}
