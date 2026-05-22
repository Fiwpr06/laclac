'use server';

import { Buffer } from 'node:buffer';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  AdminFoodPayload,
  ContextTag,
  CookingStyle,
  DietTag,
  MealType,
  PriceRange,
  createFood,
  deleteFood,
  uploadMediaImage,
  updateFood,
} from '../../src/lib/api';
import { resolveAutoImageUrl } from '../../src/lib/auto-image';

const MEAL_TYPE_VALUES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const PRICE_RANGE_VALUES: PriceRange[] = ['cheap', 'medium', 'expensive'];
const COOKING_STYLE_VALUES: CookingStyle[] = ['soup', 'dry', 'fried', 'grilled', 'raw', 'steamed'];
const DIET_TAG_VALUES: DietTag[] = ['vegetarian', 'vegan', 'keto', 'clean'];
const CONTEXT_TAG_VALUES: ContextTag[] = ['solo', 'date', 'group', 'travel', 'office'];

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Không thể xử lý yêu cầu CRUD món ăn';
};

const getRequiredText = (formData: FormData, field: string, label: string): string => {
  const value = formData.get(field);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} là bắt buộc`);
  }

  return value.trim();
};

const getOptionalText = (formData: FormData, field: string): string | undefined => {
  const value = formData.get(field);
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};

const parseCsvList = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueList = (items: string[]): string[] => {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
};

const parseListField = (formData: FormData, field: string): string[] => {
  const values = formData
    .getAll(field)
    .filter((entry): entry is string => typeof entry === 'string')
    .flatMap((entry) => entry.split(','));

  return uniqueList(values);
};

const parseOptionalNumber = (value: string | undefined, label: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${label} phải là số không âm`);
  }

  return Math.floor(numberValue);
};

const parsePriceRange = (value: string): PriceRange => {
  if (PRICE_RANGE_VALUES.includes(value as PriceRange)) {
    return value as PriceRange;
  }

  throw new Error('Giá trị priceRange không hợp lệ');
};

const parseEnumList = <TEnum extends string>(
  values: string[],
  validValues: readonly TEnum[],
  label: string,
  options?: { required?: boolean },
): TEnum[] => {
  const invalidValues = values.filter((value) => !validValues.includes(value as TEnum));
  if (invalidValues.length > 0) {
    throw new Error(`${label} không hợp lệ: ${invalidValues.join(', ')}`);
  }

  if (options?.required && values.length === 0) {
    throw new Error(`${label} là bắt buộc`);
  }

  return values as TEnum[];
};

const parseMealTypes = (formData: FormData): MealType[] => {
  const mealTypes = parseEnumList(
    parseListField(formData, 'mealTypes'),
    MEAL_TYPE_VALUES,
    'Meal types',
    {
      required: true,
    },
  );

  if (mealTypes.length === 0) {
    throw new Error('Meal types là bắt buộc');
  }

  return mealTypes;
};

const parseDietTags = (formData: FormData): DietTag[] => {
  return parseEnumList(parseListField(formData, 'dietTags'), DIET_TAG_VALUES, 'Diet tags');
};

const parseContextTags = (formData: FormData): ContextTag[] => {
  return parseEnumList(parseListField(formData, 'contextTags'), CONTEXT_TAG_VALUES, 'Context tags');
};

const parseCookingStyle = (value: string | undefined): CookingStyle | undefined => {
  if (!value) {
    return undefined;
  }

  if (COOKING_STYLE_VALUES.includes(value as CookingStyle)) {
    return value as CookingStyle;
  }

  throw new Error('Cooking style không hợp lệ');
};

const isFileValue = (value: FormDataEntryValue | null): value is File => {
  return typeof File !== 'undefined' && value instanceof File;
};

const getOptionalFile = (formData: FormData, field: string): File | undefined => {
  const value = formData.get(field);
  if (!isFileValue(value) || value.size <= 0) {
    return undefined;
  }

  return value;
};

const fileToDataUrl = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const mimeType = file.type || 'application/octet-stream';
  const encoded = Buffer.from(bytes).toString('base64');
  return `data:${mimeType};base64,${encoded}`;
};

const uploadFileAndGetUrl = async (file: File, dishName: string): Promise<string> => {
  const dataUrl = await fileToDataUrl(file);
  const uploaded = await uploadMediaImage({ imageBase64: dataUrl, assetName: dishName });
  return uploaded.url;
};

const uploadUrlAndGetUrl = async (imageUrl: string, dishName: string): Promise<string> => {
  try {
    const uploaded = await uploadMediaImage({ imageUrl, assetName: dishName });
    return uploaded.url;
  } catch (err) {
    console.warn('Fallback to raw imageUrl due to upload failure:', err);
    return imageUrl;
  }
};

const resolveImages = async (
  formData: FormData,
  dishName: string,
): Promise<{ thumbnailImage?: string; images: string[] }> => {
  let selectedImage: string | undefined;
  const imageUrl = getOptionalText(formData, 'imageUrl');
  const originalImageUrl = getOptionalText(formData, 'originalImageUrl');

  const imageFile = getOptionalFile(formData, 'imageFile');
  if (imageFile) {
    selectedImage = await uploadFileAndGetUrl(imageFile, dishName);
  } else if (imageUrl && imageUrl !== originalImageUrl) {
    selectedImage = await uploadUrlAndGetUrl(imageUrl, dishName);
  } else if (imageUrl) {
    selectedImage = imageUrl;
  }

  const normalized = selectedImage?.trim();

  return {
    thumbnailImage: normalized,
    images: normalized ? [normalized] : [],
  };
};

const buildFoodPayload = async (formData: FormData): Promise<AdminFoodPayload> => {
  const nameVi = getRequiredText(formData, 'name', 'Tên món ăn');
  const priceRange = parsePriceRange(getRequiredText(formData, 'priceRange', 'Price range'));
  const mealTypes = parseMealTypes(formData);
  const ingredients = parseCsvList(getRequiredText(formData, 'ingredientsCsv', 'Ingredients'));
  const dietTags = parseDietTags(formData);
  const contextTags = parseContextTags(formData);
  let { thumbnailImage, images } = await resolveImages(formData, nameVi);

  if (!thumbnailImage && images.length === 0) {
    const autoImageUrl = await resolveAutoImageUrl(nameVi);
    if (autoImageUrl) {
      thumbnailImage = autoImageUrl;
      images = [autoImageUrl];
    }
  }

  if (ingredients.length === 0) {
    throw new Error('Ingredients là bắt buộc');
  }

  const desc = getOptionalText(formData, 'description');

  return {
    name: { vi: nameVi, en: '' },
    description: desc ? { vi: desc, en: '' } : undefined,
    images,
    thumbnailImage,
    category: getOptionalText(formData, 'category'),
    mealTypes,
    priceRange,
    ingredients: { vi: ingredients, en: [] },
    dietTags,
    allergens: parseCsvList(getOptionalText(formData, 'allergensCsv')),
    tags: { vi: parseCsvList(getOptionalText(formData, 'tagsCsv')), en: [] },
    origin: getOptionalText(formData, 'origin'),
    cookingStyle: parseCookingStyle(getOptionalText(formData, 'cookingStyle')),
    contextTags,
    priceMin: parseOptionalNumber(getOptionalText(formData, 'priceMin'), 'Giá tối thiểu'),
    priceMax: parseOptionalNumber(getOptionalText(formData, 'priceMax'), 'Giá tối đa'),
    calories: parseOptionalNumber(getOptionalText(formData, 'calories'), 'Calories'),
    isActive: formData.get('isActive') === 'on',
  };
};

export async function createFoodAction(formData: FormData): Promise<void> {
  let redirectUrl: string;
  try {
    const payload = await buildFoodPayload(formData);
    await createFood(payload);
    revalidatePath('/');
    revalidatePath('/foods');
    redirectUrl = '/?status=created';
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    redirectUrl = `/?error=${encodeURIComponent(toErrorMessage(error))}`;
  }
  redirect(redirectUrl);
}

export async function updateFoodAction(formData: FormData): Promise<void> {
  const foodId = getRequiredText(formData, 'id', 'Food ID');
  let redirectUrl: string;
  try {
    const payload = await buildFoodPayload(formData);
    await updateFood(foodId, payload);
    revalidatePath('/');
    revalidatePath('/foods');
    redirectUrl = `/?status=updated&foodId=${encodeURIComponent(foodId)}`;
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    redirectUrl = `/?foodId=${encodeURIComponent(foodId)}&error=${encodeURIComponent(toErrorMessage(error))}`;
  }
  redirect(redirectUrl);
}

export async function deleteFoodAction(formData: FormData): Promise<void> {
  const foodId = getRequiredText(formData, 'id', 'Food ID');
  let redirectUrl: string;
  try {
    await deleteFood(foodId);
    revalidatePath('/');
    revalidatePath('/foods');
    redirectUrl = '/?status=deleted';
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    redirectUrl = `/?foodId=${encodeURIComponent(foodId)}&error=${encodeURIComponent(toErrorMessage(error))}`;
  }
  redirect(redirectUrl);
}
