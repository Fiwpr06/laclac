const DEFAULT_API_BASE = 'http://localhost:3100/api/v1';
const DEFAULT_FOOD_API_BASE = 'http://localhost:3002/api/v1';
const DEFAULT_MEDIA_API_BASE = 'http://localhost:3005/api/v1';

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
  if (!raw) {
    return DEFAULT_API_BASE;
  }

  return raw;
})();

const FOOD_API_BASES = [
  normalizeApiBase(process.env['NEXT_PUBLIC_FOOD_API_URL']),
  API_BASE,
  DEFAULT_FOOD_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

const MEDIA_API_BASES = [
  normalizeApiBase(process.env['NEXT_PUBLIC_MEDIA_API_URL']),
  API_BASE,
  DEFAULT_MEDIA_API_BASE,
].filter((value, index, array): value is string => !!value && array.indexOf(value) === index);

type ApiEnvelope<T, TMeta = unknown> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: TMeta;
};

export type PriceRange = 'cheap' | 'medium' | 'expensive';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CookingStyle = 'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed';
export type DietTag = 'vegetarian' | 'vegan' | 'keto' | 'clean';
export type ContextTag = 'solo' | 'date' | 'group' | 'travel' | 'office';
export type CategoryType = 'cuisine' | 'meal_type' | 'diet';

export type AdminFood = {
  _id: string;
  name: { vi: string; en?: string };
  description?: { vi: string; en?: string } | string;
  images?: string[];
  thumbnailImage?: string;
  category?: string | { _id?: string; name?: string };
  mealTypes: MealType[];
  priceRange: PriceRange;
  ingredients: { vi: string[]; en?: string[] } | string[];
  dietTags?: DietTag[];
  allergens?: string[];
  tags?: { vi: string[]; en?: string[] } | string[];
  origin?: string;
  cookingStyle?: CookingStyle;
  contextTags?: ContextTag[];
  priceMin?: number;
  priceMax?: number;
  calories?: number;
  isActive?: boolean;
};

export type AdminFoodPayload = {
  name: { vi: string; en?: string };
  description?: { vi: string; en?: string } | string;
  images?: string[];
  thumbnailImage?: string;
  category?: string;
  mealTypes: MealType[];
  priceRange: PriceRange;
  ingredients: { vi: string[]; en?: string[] } | string[];
  dietTags?: DietTag[];
  allergens?: string[];
  tags?: { vi: string[]; en?: string[] } | string[];
  origin?: string;
  cookingStyle?: CookingStyle;
  contextTags?: ContextTag[];
  priceMin?: number;
  priceMax?: number;
  calories?: number;
  isActive?: boolean;
};

export type AdminCategory = {
  _id: string;
  name: { vi: string; en?: string };
  type: CategoryType;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type AdminCategoryPayload = {
  name: { vi: string; en?: string };
  type: CategoryType;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type FoodsPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UploadedImage = {
  url: string;
  provider: string;
};

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

const sanitizeFood = (food: AdminFood): AdminFood => {
  const images = sanitizeImageList(food.images);
  const thumbnailImage = sanitizeImageUrl(food.thumbnailImage) ?? images?.[0];

  return {
    ...food,
    images,
    thumbnailImage,
  };
};

const getErrorMessage = (responseBody: unknown, status: number): string => {
  if (responseBody && typeof responseBody === 'object') {
    const message = (responseBody as { message?: string | string[] }).message;
    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return `Request failed with status ${status}`;
};

const requestApiEnvelope = async <T, TMeta = unknown>(
  path: string,
  init?: RequestInit,
  baseUrl: string = API_BASE,
): Promise<ApiEnvelope<T, TMeta>> => {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'x-admin-dev-bypass': 'true',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => undefined)) as ApiEnvelope<T, TMeta> | undefined;
  if (!response.ok) {
    throw new Error(getErrorMessage(body, response.status));
  }

  if (!body) {
    return {
      success: true,
      data: null as T,
    };
  }

  return body;
};

const requestApiEnvelopeFromBases = async <T, TMeta = unknown>(
  path: string,
  init?: RequestInit,
  baseUrls: string[] = FOOD_API_BASES,
): Promise<ApiEnvelope<T, TMeta>> => {
  let lastError: unknown;

  for (const baseUrl of baseUrls) {
    try {
      return await requestApiEnvelope<T, TMeta>(path, init, baseUrl);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Khong the ket noi API');
};

const requestApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const body = await requestApiEnvelopeFromBases<T>(path, init);
  return (body.data ?? null) as T;
};

export const fetchFoods = async (): Promise<AdminFood[]> => {
  const limit = 50;
  const foods: AdminFood[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await requestApiEnvelopeFromBases<AdminFood[], FoodsPaginationMeta>(
      `/foods/?page=${page}&limit=${limit}`,
    );

    const items = Array.isArray(result.data) ? result.data : [];
    foods.push(...items.map((item) => sanitizeFood(item)));

    if (result.meta?.totalPages) {
      hasMore = page < result.meta.totalPages;
    } else {
      hasMore = items.length === limit;
    }

    page += 1;

    if (page > 500) {
      hasMore = false;
    }
  }

  return foods;
};

export const fetchFoodById = async (foodId: string): Promise<AdminFood> => {
  const food = await requestApi<AdminFood>(`/foods/${foodId}`);
  return sanitizeFood(food);
};

export const uploadMediaImage = async (payload: {
  imageUrl?: string;
  imageBase64?: string;
  assetName?: string;
}): Promise<UploadedImage> => {
  let lastError: unknown;

  for (const baseUrl of MEDIA_API_BASES) {
    try {
      const result = await requestApiEnvelope<UploadedImage>(
        '/media/upload',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        baseUrl,
      );

      return result.data;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Không thể upload ảnh');
};

export const createFood = async (payload: AdminFoodPayload): Promise<AdminFood> => {
  const food = await requestApi<AdminFood>('/foods/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return sanitizeFood(food);
};

export const updateFood = async (
  foodId: string,
  payload: Partial<AdminFoodPayload>,
): Promise<AdminFood> => {
  const food = await requestApi<AdminFood>(`/foods/${foodId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return sanitizeFood(food);
};

export const deleteFood = async (foodId: string): Promise<{ deleted: boolean }> => {
  return requestApi<{ deleted: boolean }>(`/foods/${foodId}`, {
    method: 'DELETE',
  });
};

export const fetchCategories = async (): Promise<AdminCategory[]> => {
  return requestApi<AdminCategory[]>('/categories/');
};

export const createCategory = async (payload: AdminCategoryPayload): Promise<AdminCategory> => {
  return requestApi<AdminCategory>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateCategory = async (
  categoryId: string,
  payload: Partial<AdminCategoryPayload>,
): Promise<AdminCategory> => {
  return requestApi<AdminCategory>(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteCategory = async (categoryId: string): Promise<{ deleted: boolean }> => {
  return requestApi<{ deleted: boolean }>(`/categories/${categoryId}`, {
    method: 'DELETE',
  });
};
