const API_BASE = "https://api.skup.ge/v1";

export type Cuisine = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  district?: string | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  discountPercent?: number | null;
  ratingAvg: number;
  reviewsCount: number;
  status: string;
  cuisine?: Cuisine | null;
  cover_photo?: string | null;
  photos?: { id: string; url: string; isCover?: boolean; sortOrder?: number }[];
  workingHours?: { day: number; open?: string; close?: string; isClosed?: boolean }[];
};

export type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    photoUrl?: string | null;
    isAvailable: boolean;
  }[];
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  reviewerAvatar?: string | null;
  createdAt: string;
  status: string;
};

export type RestaurantEvent = {
  id: string;
  title: string;
  description?: string | null;
  emoji?: string | null;
  eventDate?: string | null;
  isActive: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Request failed: " + response.status);
  }
  return response.json();
}

export async function getRestaurants(params: Record<string, string | number | boolean | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const suffix = search.toString() ? "?" + search.toString() : "";
  return request<{ data: Restaurant[]; total: number; page: number; limit: number }>("/restaurants" + suffix);
}

export async function getRestaurant(id: string) {
  return request<Restaurant>("/restaurants/" + encodeURIComponent(id));
}

export async function getMenu(id: string) {
  return request<MenuCategory[]>("/restaurants/" + encodeURIComponent(id) + "/menu");
}

export async function getReviews(id: string) {
  return request<Review[]>("/reviews?restaurant_id=" + encodeURIComponent(id) + "&page=1");
}

export async function getEvents(id: string) {
  return request<RestaurantEvent[]>("/events/restaurant/" + encodeURIComponent(id));
}

export async function getCuisines() {
  return request<Cuisine[]>("/cuisines");
}

export async function getCollections() {
  return request<{ id: string; titleKa: string; subtitle?: string | null; emoji: string; accent: string; bg: string; filterType: string; filterValue?: string | null; isActive: boolean; sortOrder: number }[]>("/collections");
}

export async function getHomeConfig() {
  return request<{ id: number; sectionKey: string; titleKa: string; isActive: boolean; sortOrder: number }[]>("/home-config");
}

export async function login(identifier: string, password: string) {
  return request<{ user: Record<string, unknown>; tokens: { access_token: string; refresh_token: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function getMe(token: string) {
  return request<Record<string, unknown>>("/auth/me", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getMyBookings(token: string) {
  return request<any[]>("/bookings/my", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function createBooking(token: string, payload: {
  restaurant_id: string;
  date: string;
  time: string;
  guests_count: number;
  comment?: string;
}) {
  return request<any>("/bookings", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function getFavorites(token: string) {
  return request<Restaurant[]>("/favorites", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getLoyalty(token: string) {
  return request<{ points: number; tier: string; nextTier?: string | null; progress: number; referralCode?: string | null }>("/auth/me/loyalty", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function addFavorite(token: string, restaurantId: string) {
  return request<any>("/favorites", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ restaurant_id: restaurantId }),
  });
}

export async function removeFavorite(token: string, restaurantId: string) {
  return request<any>("/favorites/" + encodeURIComponent(restaurantId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}
