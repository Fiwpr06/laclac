'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  AdminCategoryPayload,
  CategoryType,
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../src/lib/api';

const CATEGORY_TYPE_VALUES: CategoryType[] = ['cuisine', 'meal_type', 'diet'];

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Khong the xu ly yeu cau CRUD category';
};

const getRequiredText = (formData: FormData, field: string, label: string): string => {
  const value = formData.get(field);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} la bat buoc`);
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

const parseCategoryType = (value: string): CategoryType => {
  if (CATEGORY_TYPE_VALUES.includes(value as CategoryType)) {
    return value as CategoryType;
  }

  throw new Error('Category type khong hop le');
};

const parseSortOrder = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error('Sort order phai la so khong am');
  }

  return Math.floor(numericValue);
};

const buildCategoryPayload = (formData: FormData): AdminCategoryPayload => {
  return {
    name: { vi: getRequiredText(formData, 'name', 'Ten category'), en: '' },
    type: parseCategoryType(getRequiredText(formData, 'type', 'Category type')),
    icon: getOptionalText(formData, 'icon'),
    sortOrder: parseSortOrder(getOptionalText(formData, 'sortOrder')),
    isActive: formData.get('isActive') === 'on',
  };
};

export async function createCategoryAction(formData: FormData): Promise<void> {
  try {
    await createCategory(buildCategoryPayload(formData));
    revalidatePath('/categories');
    redirect('/categories?status=created');
  } catch (error) {
    redirect(`/categories?error=${encodeURIComponent(toErrorMessage(error))}`);
  }
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const categoryId = getRequiredText(formData, 'id', 'Category id');

  try {
    await updateCategory(categoryId, buildCategoryPayload(formData));
    revalidatePath('/categories');
    redirect('/categories?status=updated');
  } catch (error) {
    redirect(`/categories?error=${encodeURIComponent(toErrorMessage(error))}`);
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const categoryId = getRequiredText(formData, 'id', 'Category id');

  try {
    await deleteCategory(categoryId);
    revalidatePath('/categories');
    redirect('/categories?status=deleted');
  } catch (error) {
    redirect(`/categories?error=${encodeURIComponent(toErrorMessage(error))}`);
  }
}
