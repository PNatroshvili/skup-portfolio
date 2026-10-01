const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/skup";

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
  avgMenuPrice?: number | null;
  priceLevel?: "1" | "2" | "3" | null;
  isOpen?: boolean;
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
  user?: { name?: string | null; lastName?: string | null };
};

export type RestaurantEvent = {
  id: string;
  title: string;
  description?: string | null;
  emoji?: string | null;
  eventDate?: string | null;
  isActive: boolean;
};

export type UserNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type RestaurantOffer = {
  id: string;
  restaurantId: string;
  title: string;
  description?: string | null;
  discountPercent?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  minimumGuests?: number | null;
  maximumGuests?: number | null;
  isActive: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function getHeaderValue(headers: HeadersInit | undefined, name: string) {
  if (!headers) return "";
  if (headers instanceof Headers) return headers.get(name) || "";
  if (Array.isArray(headers)) return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || "";
  return String((headers as Record<string, string>)[name] || (headers as Record<string, string>)[name.toLowerCase()] || "");
}

async function refreshStoredSession() {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("skup_refresh_token");
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    })
      .then(async response => {
        if (!response.ok) return null;
        const result = await response.json() as { access_token?: string; refresh_token?: string };
        if (!result.access_token) return null;
        localStorage.setItem("skup_access_token", result.access_token);
        if (result.refresh_token) localStorage.setItem("skup_refresh_token", result.refresh_token);
        window.dispatchEvent(new Event("skup-auth-changed"));
        return result.access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const authHeader = getHeaderValue(init?.headers, "Authorization");
  const response = await fetch(API_BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 && authHeader && retry) {
    const freshToken = await refreshStoredSession();
    if (freshToken) {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", "Bearer " + freshToken);
      return request<T>(path, { ...init, headers }, false);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("skup_access_token");
      localStorage.removeItem("skup_refresh_token");
      localStorage.removeItem("skup_user");
      window.dispatchEvent(new Event("skup-auth-changed"));
    }
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw || "Request failed: " + response.status;
    try {
      const parsed = JSON.parse(raw);
      const detail = parsed?.message;
      message = Array.isArray(detail) ? detail.join(", ") : detail || message;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
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

export async function createReview(token: string, payload: { restaurant_id: string; rating: number; comment?: string }) {
  return request<any>("/reviews", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function getReviews(id: string) {
  return request<{ data: Review[]; total: number; page: number; limit: number }>("/reviews?restaurant_id=" + encodeURIComponent(id) + "&page=1");
}

export async function getEvents(id: string) {
  return request<RestaurantEvent[]>("/events/restaurant/" + encodeURIComponent(id));
}

export async function getOffers(params: { restaurantId?: string; date?: string; time?: string; guests?: number } = {}) {
  const search = new URLSearchParams();
  if (params.restaurantId) search.set("restaurant_id", params.restaurantId);
  if (params.date) search.set("date", params.date);
  if (params.time) search.set("time", params.time);
  if (params.guests) search.set("guests", String(params.guests));
  const query = search.toString() ? "?" + search.toString() : "";
  return request<RestaurantOffer[]>("/offers" + query);
}

export async function getMyOffers(token: string) {
  return request<RestaurantOffer[]>("/offers/mine", { headers: { Authorization: "Bearer " + token } });
}

export async function createOffer(token: string, restaurantId: string, payload: Partial<RestaurantOffer> & { title: string }) {
  return request<RestaurantOffer>("/offers/" + encodeURIComponent(restaurantId), {
    method: "POST", headers: { Authorization: "Bearer " + token }, body: JSON.stringify(payload),
  });
}

export async function updateOffer(token: string, offerId: string, payload: Partial<RestaurantOffer>) {
  return request<RestaurantOffer>("/offers/" + encodeURIComponent(offerId), {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify(payload),
  });
}

export async function deleteOffer(token: string, offerId: string) {
  return request<{ ok: boolean }>("/offers/" + encodeURIComponent(offerId), {
    method: "DELETE", headers: { Authorization: "Bearer " + token },
  });
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

export type BookingRecord = {
  id: string;
  restaurantId: string;
  userId: string;
  date: string;
  time: string;
  guestsCount: number;
  comment?: string | null;
  offerId?: string | null;
  discountPercentApplied?: number | null;
  status: string;
  restaurant?: { id: string; name: string; address: string; cover_photo?: string | null };
};

export type AvailabilitySlot = { time: string; available: boolean };
export type Availability = {
  date: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string;
  slots: AvailabilitySlot[];
};

export async function getAvailability(restaurantId: string, date: string, guests = 2) {
  return request<Availability>(
    "/bookings/availability?restaurant_id=" +
      encodeURIComponent(restaurantId) +
      "&date=" +
      encodeURIComponent(date) +
      "&guests=" +
      encodeURIComponent(String(guests)),
  );
}

export async function register(payload: {
  name: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  referralCode?: string;
}) {
  return request<{ requiresVerification: boolean; email: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(email: string, code: string) {
  return request<{ user: Record<string, unknown>; tokens: { access_token: string; refresh_token: string } }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resendVerificationCode(email: string) {
  return request<{ ok: boolean }>("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string) {
  return request<{ ok: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return request<{ ok: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return request<{ access_token: string; refresh_token: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function updateProfile(token: string, payload: {
  name?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  return request<any>("/auth/me", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
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

export async function getMyRestaurant(token: string) {
  return request<Restaurant & { menuCategories?: MenuCategory[] } & { workingHours?: Restaurant["workingHours"] }>("/restaurants/mine", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getMyRestaurantBookings(token: string) {
  return request<BookingRecord[]>("/bookings/my-restaurant", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getMyRestaurantEvents(token: string) {
  return request<RestaurantEvent[]>("/events/my", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function updateRestaurantInfo(token: string, restaurantId: string, payload: Partial<Pick<Restaurant, "name" | "description" | "address" | "city" | "district" | "phone">>) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/info", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function updateRestaurantDiscount(token: string, restaurantId: string, discountPercent: number | null) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/discount", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ discountPercent }),
  });
}

export async function updateRestaurantHours(token: string, restaurantId: string, hours: NonNullable<Restaurant["workingHours"]>) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/working-hours", {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ hours }),
  });
}

export async function addMenuCategory(token: string, restaurantId: string, name: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-categories", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ name }),
  });
}

export async function updateMenuCategory(token: string, restaurantId: string, categoryId: string, name: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-categories/" + encodeURIComponent(categoryId), {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ name }),
  });
}

export async function addMenuItem(token: string, restaurantId: string, categoryId: string, payload: { name: string; description?: string; price: number; isAvailable?: boolean }) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-categories/" + encodeURIComponent(categoryId) + "/items", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function updateMenuItem(token: string, restaurantId: string, itemId: string, payload: { name?: string; description?: string; price?: number; isAvailable?: boolean }) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-items/" + encodeURIComponent(itemId), {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function uploadMenuItemPhoto(token: string, restaurantId: string, itemId: string, file: File) {
  const form = new FormData();
  form.set("photo", file);
  return uploadRequest<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-items/" + encodeURIComponent(itemId), token, form, "PATCH");
}

async function uploadRequest<T>(path: string, token: string, form: FormData, method = "POST", retry = true): Promise<T> {
  const response = await fetch(API_BASE + path, {
    method,
    headers: { Authorization: "Bearer " + token },
    body: form,
    cache: "no-store",
  });
  if (response.status === 401 && retry) {
    const freshToken = await refreshStoredSession();
    if (freshToken) return uploadRequest<T>(path, freshToken, form, method, false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("skup_access_token");
      localStorage.removeItem("skup_refresh_token");
      localStorage.removeItem("skup_user");
      window.dispatchEvent(new Event("skup-auth-changed"));
    }
  }
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw || "Upload failed: " + response.status;
    try {
      const parsed = JSON.parse(raw);
      message = Array.isArray(parsed?.message) ? parsed.message.join(", ") : parsed?.message || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export async function uploadRestaurantPhoto(token: string, restaurantId: string, file: File, isCover = false) {
  const form = new FormData();
  form.set("photo", file);
  form.set("isCover", String(isCover));
  return uploadRequest<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/photos", token, form);
}

export async function setCoverPhoto(token: string, restaurantId: string, photoId: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/photos/" + encodeURIComponent(photoId) + "/cover", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function deleteRestaurantPhoto(token: string, restaurantId: string, photoId: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/photos/" + encodeURIComponent(photoId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function deleteMenuCategory(token: string, restaurantId: string, categoryId: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-categories/" + encodeURIComponent(categoryId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function deleteMenuItem(token: string, restaurantId: string, itemId: string) {
  return request<any>("/restaurants/" + encodeURIComponent(restaurantId) + "/menu-items/" + encodeURIComponent(itemId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function createRestaurantEvent(token: string, restaurantId: string, payload: { title: string; description?: string; emoji?: string; eventDate?: string }) {
  return request<any>("/events/restaurant/" + encodeURIComponent(restaurantId), {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function deleteRestaurantEvent(token: string, eventId: string) {
  return request<any>("/events/" + encodeURIComponent(eventId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getMyBookings(token: string) {
  return request<BookingRecord[]>("/bookings/my", {
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

export async function updateBookingStatus(token: string, bookingId: string, status: "cancelled" | "confirmed" | "rejected") {
  return request<any>("/bookings/" + encodeURIComponent(bookingId) + "/status", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ status }),
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

export async function getChatMessages(token: string, bookingId: string) {
  return request<{ id: string; bookingId: string; senderId: string; senderRole: string; content: string; createdAt: string }[]>(
    "/chat/" + encodeURIComponent(bookingId),
    { headers: { Authorization: "Bearer " + token } },
  );
}

export async function getAdminStats(token: string) {
  return request<any>("/admin/stats", { headers: { Authorization: "Bearer " + token } });
}

export async function getAdminBookingsChart(token: string) {
  return request<{ date: string; count: number }[]>("/admin/stats/bookings-chart", { headers: { Authorization: "Bearer " + token } });
}

export async function getAdminTopRestaurants(token: string) {
  return request<{ name: string; bookings: number }[]>("/admin/stats/top-restaurants", { headers: { Authorization: "Bearer " + token } });
}

export async function getAdminRestaurants(token: string, params: { status?: string; q?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return request<{ data: any[]; total: number; page: number; limit: number }>("/admin/restaurants" + (search.toString() ? "?" + search.toString() : ""), {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function updateAdminRestaurantStatus(token: string, restaurantId: string, status: string) {
  return request<any>("/admin/restaurants/" + encodeURIComponent(restaurantId) + "/status", {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ status }),
  });
}

export async function deleteAdminRestaurant(token: string, restaurantId: string) {
  return request<any>("/admin/restaurants/" + encodeURIComponent(restaurantId), {
    method: "DELETE", headers: { Authorization: "Bearer " + token },
  });
}

export async function getAdminUsers(token: string, params: { role?: string; q?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return request<{ data: any[]; total: number; page: number; limit: number }>("/admin/users" + (search.toString() ? "?" + search.toString() : ""), {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function updateAdminUserStatus(token: string, userId: string, status: "active" | "blocked") {
  return request<any>("/admin/users/" + encodeURIComponent(userId) + "/status", {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ status }),
  });
}

export async function updateAdminUserRole(token: string, userId: string, role: string) {
  return request<any>("/admin/users/" + encodeURIComponent(userId) + "/role", {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ role }),
  });
}

export async function verifyAdminUserEmail(token: string, userId: string) {
  return request<any>("/admin/users/" + encodeURIComponent(userId) + "/verify-email", {
    method: "PATCH", headers: { Authorization: "Bearer " + token },
  });
}

export async function deleteAdminUser(token: string, userId: string) {
  return request<any>("/admin/users/" + encodeURIComponent(userId), {
    method: "DELETE", headers: { Authorization: "Bearer " + token },
  });
}

export async function getAdminBookings(token: string, params: { status?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return request<{ data: any[]; total: number; page: number; limit: number }>("/admin/bookings" + (search.toString() ? "?" + search.toString() : ""), {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function getAdminReviews(token: string, params: { status?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return request<{ data: any[]; total: number; page: number; limit: number }>("/admin/reviews" + (search.toString() ? "?" + search.toString() : ""), {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function updateAdminReviewStatus(token: string, reviewId: string, status: "approved" | "hidden") {
  return request<any>("/admin/reviews/" + encodeURIComponent(reviewId) + "/status", {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ status }),
  });
}

export async function deleteAdminReview(token: string, reviewId: string) {
  return request<any>("/admin/reviews/" + encodeURIComponent(reviewId), {
    method: "DELETE", headers: { Authorization: "Bearer " + token },
  });
}

export async function sendAdminBroadcast(token: string, title: string, body: string) {
  return request<any>("/admin/notifications/send-all", {
    method: "POST", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ title, body }),
  });
}

export async function getAdminCollections(token: string) {
  return request<any[]>("/admin/collections", { headers: { Authorization: "Bearer " + token } });
}

export async function updateAdminCollection(token: string, id: string, data: any) {
  return request<any>("/admin/collections/" + encodeURIComponent(id), {
    method: "PATCH", headers: { Authorization: "Bearer " + token }, body: JSON.stringify(data),
  });
}

export async function deleteAdminCollection(token: string, id: string) {
  return request<any>("/admin/collections/" + encodeURIComponent(id), {
    method: "DELETE", headers: { Authorization: "Bearer " + token },
  });
}

export async function getAdminHomeSections(token: string) {
  return request<any[]>("/admin/home-sections", { headers: { Authorization: "Bearer " + token } });
}

export async function toggleAdminHomeSection(token: string, key: string) {
  return request<any>("/admin/home-sections/" + encodeURIComponent(key) + "/toggle", {
    method: "PATCH", headers: { Authorization: "Bearer " + token },
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


export async function getNotifications(token: string) {
  return request<{ data: UserNotification[]; unreadCount: number }>("/notifications", { headers: { Authorization: "Bearer " + token } });
}

export async function markNotificationRead(token: string, id: string) {
  return request<UserNotification>("/notifications/" + encodeURIComponent(id) + "/read", { method: "PATCH", headers: { Authorization: "Bearer " + token } });
}

export async function markAllNotificationsRead(token: string) {
  return request<{ ok: boolean }>("/notifications/read-all", { method: "PATCH", headers: { Authorization: "Bearer " + token } });
}


export type WaitlistEntry = {
  id: string;
  restaurantId: string;
  userId: string;
  date: string;
  timeFrom?: string | null;
  timeTo?: string | null;
  guestsCount: number;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
};

export async function joinWaitlist(token: string, payload: { restaurant_id: string; date: string; time_from?: string; time_to?: string; guests_count: number }) {
  return request<WaitlistEntry>("/waitlist", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  });
}

export async function getMyWaitlist(token: string) {
  return request<WaitlistEntry[]>("/waitlist/mine", { headers: { Authorization: "Bearer " + token } });
}

export async function cancelWaitlist(token: string, id: string) {
  return request<WaitlistEntry>("/waitlist/" + encodeURIComponent(id), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}


export async function getRestaurantWaitlist(token: string, restaurantId: string) {
  return request<WaitlistEntry[]>("/waitlist/restaurant/" + encodeURIComponent(restaurantId), { headers: { Authorization: "Bearer " + token } });
}

export async function updateWaitlistStatus(token: string, id: string, status: "waiting" | "notified" | "booked" | "cancelled" | "expired") {
  return request<WaitlistEntry>("/waitlist/" + encodeURIComponent(id) + "/status", {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify({ status }),
  });
}
