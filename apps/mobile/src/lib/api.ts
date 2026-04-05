const API_URL =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[
    'EXPO_PUBLIC_API_URL'
  ] ?? 'http://localhost:3100/api/v1';

export type MobileFilter = {
  priceRange?: 'cheap' | 'medium' | 'expensive';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietTag?: 'vegetarian' | 'vegan' | 'keto' | 'clean';
  context?: 'solo' | 'date' | 'group' | 'travel' | 'office';
};

export type FoodItem = {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  thumbnailImage?: string;
  priceRange?: string;
  calories?: number;
  cookingStyle?: string;
  origin?: string;
};

const buildQuery = (filters?: MobileFilter): string => {
  if (!filters) return '';

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
};

export const fetchRandomFood = async (filters?: MobileFilter): Promise<FoodItem | null> => {
  const query = buildQuery(filters);
  const url = `${API_URL}/foods/random${query ? `?${query}` : ''}`;

  const response = await fetch(url);
  const body = (await response.json()) as { success: boolean; data: FoodItem | null };
  return body.data;
};

export const fetchSwipeQueue = async (filters?: MobileFilter): Promise<FoodItem[]> => {
  const query = buildQuery(filters);
  const url = `${API_URL}/foods/swipe-queue${query ? `?${query}` : ''}`;

  const response = await fetch(url);
  const body = (await response.json()) as { success: boolean; data: FoodItem[] };
  return body.data ?? [];
};

export const fetchFoodDetail = async (id: string): Promise<FoodItem | null> => {
  const response = await fetch(`${API_URL}/foods/${id}`);
  const body = (await response.json()) as { success: boolean; data: FoodItem | null };
  return body.data;
};

export const logAction = async (payload: {
  sessionId: string;
  foodId?: string;
  actionType:
    | 'swipe_right'
    | 'swipe_left'
    | 'view_detail'
    | 'shake_result'
    | 'favorite_add'
    | 'favorite_remove'
    | 'review_submit';
  context: 'solo' | 'date' | 'group' | 'travel' | 'office' | 'none';
  filterSnapshot?: Record<string, string | undefined>;
  sessionDurationMs?: number;
}) => {
  await fetch(`${API_URL}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      filterSnapshot: payload.filterSnapshot ?? {},
      deviceType: 'mobile',
    }),
  });
};
