/**
 * user-api.ts - Favorites and History API calls for authenticated users
 */
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://fiwpr.id.vn/api/v1';

async function authFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

export type FavoriteItem = {
  _id: string;
  foodId: string;
  listType?: string;
  addedAt: string;
};

export type HistoryItem = {
  _id: string;
  foodId: string;
  foodName: string;
  foodImage?: string | null;
  priceRange?: string | null;
  origin?: string | null;
  createdAt: string;
};

export const favoritesApi = {
  list: (token: string) =>
    authFetch<FavoriteItem[]>('/favorites', token, { method: 'GET' }),

  add: (foodId: string, token: string, listType = 'default') =>
    authFetch<FavoriteItem>('/favorites', token, {
      method: 'POST',
      body: JSON.stringify({ foodId, listType }),
    }),

  remove: (favoriteId: string, token: string) =>
    authFetch<{ deleted: boolean }>(`/favorites/${favoriteId}`, token, {
      method: 'DELETE',
    }),

  isFavorited: async (foodId: string, token: string): Promise<string | null> => {
    try {
      const list = await favoritesApi.list(token);
      const found = list.find((f) => f.foodId === foodId || (f as any).foodId?._id === foodId);
      return found?._id ?? null;
    } catch {
      return null;
    }
  },
};

export const historyApi = {
  list: (token: string, limit = 30) =>
    authFetch<HistoryItem[]>(`/history?limit=${limit}`, token, { method: 'GET' }),

  add: (
    item: { foodId: string; foodName: string; foodImage?: string; priceRange?: string; origin?: string },
    token: string,
  ) =>
    authFetch<HistoryItem>('/history', token, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
};
