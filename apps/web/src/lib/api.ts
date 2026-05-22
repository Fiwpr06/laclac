export type PriceRange = 'cheap' | 'medium' | 'expensive';
export type BudgetBucket = 'under_30k' | 'from_30k_to_50k' | 'from_50k_to_100k' | 'over_100k';
export type DishType = 'liquid' | 'dry' | 'fried_grilled';
export type CuisineType = 'vietnamese' | 'asian' | 'european';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietTag = 'vegetarian' | 'vegan' | 'keto' | 'clean';
export type CookingStyle = 'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed';
export type ContextTag = 'solo' | 'date' | 'group' | 'travel' | 'office';
export type TriggerType = 'shake' | 'button';

export type WebFilter = {
  priceRange?: PriceRange;
  budgetBucket?: BudgetBucket;
  dishType?: DishType;
  cuisineType?: CuisineType;
  category?: string;
  mealType?: MealType;
  dietTag?: DietTag;
  allergenExclude?: string[];
  cookingStyle?: CookingStyle;
  context?: ContextTag;
  maxCalories?: number;
  minCalories?: number;
  difficulty?: string[];
  maxPrepTime?: number;
  origin?: string[];
  allergensFree?: string[];
};

export type ActionFilterSnapshot = {
  priceRange?: PriceRange;
  budgetBucket?: BudgetBucket;
  dishType?: DishType;
  cuisineType?: CuisineType;
  mealType?: MealType;
  dietTag?: DietTag;
  category?: string;
};

export type FoodItem = {
  _id: string;
  name: { vi: string; en?: string };
  description?: { vi: string; en?: string };
  images?: string[];
  thumbnailImage?: string;
  category?: string | { _id?: string; name?: string | { vi: string; en?: string } };
  mealTypes?: MealType[];
  priceRange?: PriceRange;
  priceMin?: number;
  priceMax?: number;
  calories?: number;
  cookingStyle?: CookingStyle;
  dietTags?: DietTag[];
  allergens?: string[];
  tags?: { vi: string[]; en?: string[] };
  origin?: string;
};

export type ShakeActionHint = {
  sessionId: string;
  foodId?: string;
  actionType: 'shake_result';
  context: ContextTag | 'none';
  triggerType: TriggerType;
  filterSnapshot: Partial<WebFilter>;
  deviceType: 'mobile' | 'web';
};

export type ShakeResponse = {
  sessionId: string;
  triggerType: TriggerType;
  food: FoodItem | null;
  actionHint: ShakeActionHint;
};

const DEFAULT_API_BASE = 'http://localhost:3100/api/v1';
const DEFAULT_FOOD_API_BASE = 'http://localhost:3002/api/v1';
const DEFAULT_ACTION_API_BASE = 'http://localhost:3003/api/v1';

const normalizeApiBase = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\/+$/, '');
};

const API_BASE = (() => {
  const raw = normalizeApiBase(process.env['NEXT_PUBLIC_API_URL']);
  if (!raw) return DEFAULT_API_BASE;
  return raw;
})();

const FOOD_API_BASES = [
  normalizeApiBase(process.env['NEXT_PUBLIC_FOOD_API_URL']),
  API_BASE,
  DEFAULT_FOOD_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

const ACTION_API_BASES = [
  normalizeApiBase(process.env['NEXT_PUBLIC_ACTION_API_URL']),
  API_BASE,
  DEFAULT_ACTION_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

const BROKEN_IMAGE_URL_PREFIXES = ['https://res.cloudinary.com/demo/image/upload/lac-lac/'];
const WIKIMEDIA_UPLOAD_HOST = 'upload.wikimedia.org';
const WIKIMEDIA_THUMB_WIDTH = 960;

const toOptimizedWikimediaUrl = (value: string): string => {
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== WIKIMEDIA_UPLOAD_HOST) {
      return value;
    }

    if (parsed.pathname.includes('/thumb/')) {
      return value;
    }

    const match = parsed.pathname.match(/^\/wikipedia\/commons\/(.+)\/([^/]+)$/);
    if (!match) {
      return value;
    }

    const [, directory, fileName] = match;
    return `${parsed.origin}/wikipedia/commons/thumb/${directory}/${fileName}/${WIKIMEDIA_THUMB_WIDTH}px-${fileName}`;
  } catch {
    return value;
  }
};

const sanitizeImageUrl = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (BROKEN_IMAGE_URL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return undefined;
  }

  return toOptimizedWikimediaUrl(normalized);
};

const sanitizeImageList = (values?: string[]): string[] | undefined => {
  if (!values || values.length === 0) {
    return undefined;
  }

  const normalized = values
    .map((value) => sanitizeImageUrl(value))
    .filter((value): value is string => !!value);

  return normalized.length > 0 ? normalized : undefined;
};

const sanitizeFood = (food: FoodItem): FoodItem => {
  const images = sanitizeImageList(food.images);
  const thumbnailImage = sanitizeImageUrl(food.thumbnailImage) ?? images?.[0];

  return {
    ...food,
    images,
    thumbnailImage,
  };
};

const fetchFromBases = async (
  path: string,
  baseUrls: string[],
  init?: RequestInit,
): Promise<Response> => {
  let lastError: unknown;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      if (response.ok) {
        return response;
      }

      const isServerError = response.status >= 500;
      if (!isServerError || baseUrl === baseUrls[baseUrls.length - 1]) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Network request failed');
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const appendQueryParam = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item).trim()).filter(Boolean);
    if (normalized.length > 0) {
      params.set(key, normalized.join(','));
    }
    return;
  }

  const normalized = String(value).trim();
  if (normalized) {
    params.set(key, normalized);
  }
};

const queryString = (filters?: WebFilter) => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    appendQueryParam(params, key, value);
  });
  return params.toString();
};

export const toActionFilterSnapshot = (filters: WebFilter): ActionFilterSnapshot => {
  return {
    priceRange: filters.priceRange,
    budgetBucket: filters.budgetBucket,
    dishType: filters.dishType,
    cuisineType: filters.cuisineType,
    mealType: filters.mealType,
    dietTag: filters.dietTag,
    category: filters.category,
  };
};

export const getRandomFood = async (filters?: WebFilter): Promise<FoodItem | null> => {
  const query = queryString(filters);
  const response = await fetchFromBases(
    `/foods/random${query ? `?${query}` : ''}`,
    FOOD_API_BASES,
    {
      cache: 'no-store',
    },
  );
  const body = await parseJson<{ data: FoodItem | null }>(response);
  return body.data ? sanitizeFood(body.data) : null;
};

export const getSwipeQueue = async (filters?: WebFilter): Promise<FoodItem[]> => {
  const response = await fetchFromBases('/foods/swipe-queue', FOOD_API_BASES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters || {}),
    cache: 'no-store',
  });

  const body = await parseJson<{ data: FoodItem[] }>(response);
  const foods = body.data ?? [];

  return foods.map((food) => sanitizeFood(food));
};

export const postShake = async (payload: {
  sessionId: string;
  triggerType?: TriggerType;
  deviceType?: 'mobile' | 'web';
  context?: ContextTag;
  filters?: WebFilter;
}): Promise<ShakeResponse> => {
  const triggerType = payload.triggerType ?? 'button';
  const deviceType = payload.deviceType ?? 'web';

  const response = await fetchFromBases('/foods/shake', FOOD_API_BASES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: payload.sessionId,
      triggerType,
      deviceType,
      ...(payload.context ? { context: payload.context } : {}),
      ...(payload.filters ? { filters: payload.filters } : {}),
    }),
  });

  // Backward compatibility for environments where shake route isn't deployed yet.
  if (response.status === 404) {
    const food = await getRandomFood(payload.filters);
    return {
      sessionId: payload.sessionId,
      triggerType,
      food,
      actionHint: {
        sessionId: payload.sessionId,
        foodId: food?._id,
        actionType: 'shake_result',
        context: payload.context ?? 'none',
        triggerType,
        filterSnapshot: payload.filters ?? {},
        deviceType,
      },
    };
  }

  const body = await parseJson<{ data: ShakeResponse }>(response);
  return {
    ...body.data,
    food: body.data.food ? sanitizeFood(body.data.food) : null,
  };
};

export const getFoodDetail = async (id: string): Promise<FoodItem | null> => {
  const response = await fetchFromBases(`/foods/${id}`, FOOD_API_BASES, { cache: 'no-store' });
  const body = await parseJson<{ data: FoodItem | null }>(response);
  return body.data ? sanitizeFood(body.data) : null;
};

export type ActionPayload = {
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
  context: ContextTag | 'none';
  triggerType?: TriggerType;
  filterSnapshot?: ActionFilterSnapshot;
};

export const postAction = async (payload: ActionPayload) => {
  const response = await fetchFromBases('/actions/', ACTION_API_BASES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      filterSnapshot: payload.filterSnapshot ?? {},
      deviceType: 'web',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to post action (${response.status})`);
  }
};
