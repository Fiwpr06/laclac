export type PriceRange = 'cheap' | 'medium' | 'expensive';
export type BudgetBucket = 'under_30k' | 'from_30k_to_50k' | 'from_50k_to_100k' | 'over_100k';
export type DishType = 'liquid' | 'dry' | 'fried_grilled';
export type CuisineType = 'vietnamese' | 'asian' | 'european';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietTag = 'vegetarian' | 'vegan' | 'keto' | 'clean';
export type CookingStyle = 'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed';
export type ContextTag = 'solo' | 'date' | 'group' | 'travel' | 'office';
export type TriggerType = 'shake' | 'button';

export type MobileFilter = {
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
  name: string;
  description?: string;
  images?: string[];
  thumbnailImage?: string;
  category?: string | { _id?: string; name?: string };
  mealTypes?: MealType[];
  priceRange?: PriceRange;
  priceMin?: number;
  priceMax?: number;
  calories?: number;
  cookingStyle?: CookingStyle;
  dietTags?: DietTag[];
  allergens?: string[];
  tags?: string[];
  origin?: string;
};

export type ShakeActionHint = {
  sessionId: string;
  foodId?: string;
  actionType: 'shake_result';
  context: ContextTag | 'none';
  triggerType: TriggerType;
  filterSnapshot: Partial<MobileFilter>;
  deviceType: 'mobile' | 'web';
};

export type ShakeResponse = {
  sessionId: string;
  triggerType: TriggerType;
  food: FoodItem | null;
  actionHint: ShakeActionHint;
};

const PRICE_RANGE_VALUES: readonly PriceRange[] = ['cheap', 'medium', 'expensive'];
const BUDGET_BUCKET_VALUES: readonly BudgetBucket[] = [
  'under_30k',
  'from_30k_to_50k',
  'from_50k_to_100k',
  'over_100k',
];
const DISH_TYPE_VALUES: readonly DishType[] = ['liquid', 'dry', 'fried_grilled'];
const CUISINE_TYPE_VALUES: readonly CuisineType[] = ['vietnamese', 'asian', 'european'];
const MEAL_TYPE_VALUES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DIET_TAG_VALUES: readonly DietTag[] = ['vegetarian', 'vegan', 'keto', 'clean'];
const COOKING_STYLE_VALUES: readonly CookingStyle[] = [
  'soup',
  'dry',
  'fried',
  'grilled',
  'raw',
  'steamed',
];
const CONTEXT_VALUES: readonly ContextTag[] = ['solo', 'date', 'group', 'travel', 'office'];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const DEFAULT_API_BASE = 'https://fiwpr.id.vn/api/v1';
const DEFAULT_FOOD_API_BASE = 'https://fiwpr.id.vn/api/v1';
const DEFAULT_ACTION_API_BASE = 'https://fiwpr.id.vn/api/v1';
const REQUEST_TIMEOUT_MS = 10000;
const BASE_ERROR_COOLDOWN_MS = 15_000;

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

// Note: process.env.EXPO_PUBLIC_* must be accessed statically so Metro bundler
// can inline the values at build time. Dynamic access (env?.[key]) is NOT inlined.
const API_BASE = normalizeApiBase(process.env.EXPO_PUBLIC_API_URL) ?? DEFAULT_API_BASE;

const FOOD_API_BASES = [
  normalizeApiBase(process.env.EXPO_PUBLIC_FOOD_API_URL),
  API_BASE,
  DEFAULT_FOOD_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

const ACTION_API_BASES = [
  normalizeApiBase(process.env.EXPO_PUBLIC_ACTION_API_URL),
  API_BASE,
  DEFAULT_ACTION_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

const baseUnavailableUntil = new Map<string, number>();

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

const markBaseUnavailable = (baseUrl: string): void => {
  baseUnavailableUntil.set(baseUrl, Date.now() + BASE_ERROR_COOLDOWN_MS);
};

const clearBaseUnavailable = (baseUrl: string): void => {
  baseUnavailableUntil.delete(baseUrl);
};

const isBaseUnavailable = (baseUrl: string): boolean => {
  const expiresAt = baseUnavailableUntil.get(baseUrl);
  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    baseUnavailableUntil.delete(baseUrl);
    return false;
  }

  return true;
};

const fetchWithTimeout = async (
  url: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const fetchFromBases = async (
  path: string,
  baseUrls: string[],
  init?: RequestInit,
): Promise<Response> => {
  let lastError: unknown;
  const candidates = baseUrls.filter((baseUrl) => !isBaseUnavailable(baseUrl));
  const targets = candidates.length > 0 ? candidates : baseUrls;

  for (const baseUrl of targets) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${path}`, init);
      if (response.ok) {
        clearBaseUnavailable(baseUrl);
        return response;
      }

      const isServerError = response.status >= 500;
      if (!isServerError || baseUrl === targets[targets.length - 1]) {
        return response;
      }
    } catch (error) {
      markBaseUnavailable(baseUrl);
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
    const text = await response.text().catch(() => 'no-body');
    console.error(`HTTP ${response.status} Error body: ${text}`);
    throw new Error(`Request failed with status ${response.status}`);
  }

  return JSON.parse(await response.text()) as T;
};

const sanitizeEnumValue = <T extends string>(
  value: T | undefined,
  allowed: readonly T[],
): T | undefined => {
  if (!value) {
    return undefined;
  }

  return allowed.includes(value) ? value : undefined;
};

const sanitizeCategory = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized || !OBJECT_ID_REGEX.test(normalized)) {
    return undefined;
  }

  return normalized;
};

const sanitizeAllergenExclude = (value: string[] | undefined): string[] | undefined => {
  if (!value || value.length === 0) {
    return undefined;
  }

  const unique = Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  return unique.length > 0 ? unique : undefined;
};

const sanitizeFilters = (filters?: MobileFilter): MobileFilter | undefined => {
  if (!filters) {
    return undefined;
  }

  return {
    priceRange: sanitizeEnumValue(filters.priceRange, PRICE_RANGE_VALUES),
    budgetBucket: sanitizeEnumValue(filters.budgetBucket, BUDGET_BUCKET_VALUES),
    dishType: sanitizeEnumValue(filters.dishType, DISH_TYPE_VALUES),
    cuisineType: sanitizeEnumValue(filters.cuisineType, CUISINE_TYPE_VALUES),
    category: sanitizeCategory(filters.category),
    mealType: sanitizeEnumValue(filters.mealType, MEAL_TYPE_VALUES),
    dietTag: sanitizeEnumValue(filters.dietTag, DIET_TAG_VALUES),
    allergenExclude: sanitizeAllergenExclude(filters.allergenExclude),
    cookingStyle: sanitizeEnumValue(filters.cookingStyle, COOKING_STYLE_VALUES),
    context: sanitizeEnumValue(filters.context, CONTEXT_VALUES),
  };
};

const hasNonEmptyFilter = (filters: MobileFilter): boolean => {
  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined;
  });
};

const appendQueryParam = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === undefined || value === null) {
    return;
  }

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

const queryString = (filters?: MobileFilter): string => {
  const sanitizedFilters = sanitizeFilters(filters);
  if (!sanitizedFilters) {
    return '';
  }

  const params = new URLSearchParams();
  Object.entries(sanitizedFilters).forEach(([key, value]) => {
    appendQueryParam(params, key, value);
  });
  return params.toString();
};

export const toActionFilterSnapshot = (filters: MobileFilter): ActionFilterSnapshot => {
  const sanitizedFilters = sanitizeFilters(filters);

  return {
    priceRange: sanitizedFilters?.priceRange,
    budgetBucket: sanitizedFilters?.budgetBucket,
    dishType: sanitizedFilters?.dishType,
    cuisineType: sanitizedFilters?.cuisineType,
    mealType: sanitizedFilters?.mealType,
    dietTag: sanitizedFilters?.dietTag,
    category: sanitizedFilters?.category,
  };
};

export const getRandomFood = async (filters?: MobileFilter): Promise<FoodItem | null> => {
  const response = await fetchFromBases(`/foods/random`, FOOD_API_BASES, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters || {}),
  });
  const body = await parseJson<{ data: FoodItem | null }>(response);
  return body.data ? sanitizeFood(body.data) : null;
};

export const getSwipeQueue = async (filters?: MobileFilter): Promise<FoodItem[]> => {
  const response = await fetchFromBases(`/foods/swipe-queue`, FOOD_API_BASES, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters || {}),
  });

  const body = await parseJson<{ data: FoodItem[] }>(response);
  const foods = body.data ?? [];
  return foods.map((food) => sanitizeFood(food));
};

export const postShake = async (payload: {
  sessionId: string;
  triggerType?: TriggerType;
  deviceType?: 'mobile' | 'web';
  context?: ContextTag | 'none';
  filters?: MobileFilter;
}): Promise<ShakeResponse> => {
  const triggerType = payload.triggerType ?? 'shake';
  const deviceType = payload.deviceType ?? 'mobile';
  const sanitizedFilters = sanitizeFilters(payload.filters);
  const requestFilters =
    sanitizedFilters && hasNonEmptyFilter(sanitizedFilters) ? sanitizedFilters : undefined;

  const validContext =
    payload.context && CONTEXT_VALUES.includes(payload.context as ContextTag)
      ? payload.context
      : undefined;

  const response = await fetchFromBases('/foods/shake', FOOD_API_BASES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: payload.sessionId,
      triggerType,
      deviceType,
      ...(validContext ? { context: validContext } : {}),
      ...(requestFilters ? { filters: requestFilters } : {}),
    }),
  });

  if (response.status === 404) {
    const food = await getRandomFood(requestFilters);
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
        filterSnapshot: requestFilters ?? {},
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
  const response = await fetchFromBases(`/foods/${id}`, FOOD_API_BASES, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
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
  sessionDurationMs?: number;
};

export const postAction = async (payload: ActionPayload): Promise<void> => {
  const response = await fetchFromBases('/actions/', ACTION_API_BASES, {
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

  if (!response.ok) {
    throw new Error(`Failed to post action (${response.status})`);
  }
};

// Backward-compatible aliases for existing imports while migrating screens.
export const fetchRandomFood = getRandomFood;
export const fetchSwipeQueue = getSwipeQueue;
export const fetchFoodDetail = getFoodDetail;
export const logAction = postAction;
