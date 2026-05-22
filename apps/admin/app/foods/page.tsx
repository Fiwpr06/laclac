import Link from 'next/link';

import { createFoodAction, deleteFoodAction, updateFoodAction } from './actions';
import FoodImagePreviewInput from './image-preview-input';
import SubmitButton from './submit-button';
import {
  AdminCategory,
  AdminFood,
  ContextTag,
  CookingStyle,
  DietTag,
  MealType,
  PriceRange,
  fetchCategories,
  fetchFoodById,
  fetchFoods,
} from '../../src/lib/api';

type FoodsPageSearchParams = {
  status?: string;
  error?: string;
  foodId?: string;
  mode?: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
};

const PRICE_RANGE_OPTIONS: ReadonlyArray<Option<PriceRange>> = [
  { value: 'cheap', label: 'cheap' },
  { value: 'medium', label: 'medium' },
  { value: 'expensive', label: 'expensive' },
];

const COOKING_STYLE_OPTIONS: ReadonlyArray<Option<CookingStyle>> = [
  { value: 'soup', label: 'soup' },
  { value: 'dry', label: 'dry' },
  { value: 'fried', label: 'fried' },
  { value: 'grilled', label: 'grilled' },
  { value: 'raw', label: 'raw' },
  { value: 'steamed', label: 'steamed' },
];

const MEAL_TYPE_OPTIONS: ReadonlyArray<Option<MealType>> = [
  { value: 'breakfast', label: 'breakfast' },
  { value: 'lunch', label: 'lunch' },
  { value: 'dinner', label: 'dinner' },
  { value: 'snack', label: 'snack' },
];

const DIET_TAG_OPTIONS: ReadonlyArray<Option<DietTag>> = [
  { value: 'vegetarian', label: 'vegetarian' },
  { value: 'vegan', label: 'vegan' },
  { value: 'keto', label: 'keto' },
  { value: 'clean', label: 'clean' },
];

const CONTEXT_TAG_OPTIONS: ReadonlyArray<Option<ContextTag>> = [
  { value: 'solo', label: 'solo' },
  { value: 'date', label: 'date' },
  { value: 'group', label: 'group' },
  { value: 'travel', label: 'travel' },
  { value: 'office', label: 'office' },
];

const STATUS_MESSAGE_MAP: Record<string, string> = {
  created: 'Đã thêm món ăn thành công.',
  updated: 'Đã cập nhật món ăn thành công.',
  deleted: 'Đã xóa món ăn thành công.',
};

function EnumCheckboxGroup({
  title,
  name,
  options,
  selectedValues,
  ensureOneSelected,
}: {
  title: string;
  name: string;
  options: ReadonlyArray<Option<string>>;
  selectedValues?: string[];
  ensureOneSelected?: boolean;
}) {
  const selected = new Set(selectedValues ?? []);
  const shouldForceFirst = !!ensureOneSelected && selected.size === 0;

  return (
    <fieldset className="rounded border border-slate-300 p-2">
      <legend className="px-1 text-xs font-semibold uppercase text-slate-600">{title}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label key={`${name}-${option.value}`} className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.has(option.value) || (shouldForceFirst && index === 0)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toCategoryValue(food?: AdminFood): string {
  if (!food?.category) {
    return '';
  }

  if (typeof food.category === 'string') {
    return food.category;
  }

  return food.category._id ?? '';
}

function FoodFormFields({
  categories,
  food,
  ensureMealType,
  nameInputId,
}: {
  categories: AdminCategory[];
  food?: AdminFood;
  ensureMealType?: boolean;
  nameInputId: string;
}) {
  return (
    <>
      <input
        id={nameInputId}
        name="name"
        defaultValue={food?.name?.vi ?? ''}
        placeholder="Tên món ăn"
        className="rounded border p-2"
        required
      />

      <select
        name="priceRange"
        className="rounded border p-2"
        defaultValue={food?.priceRange ?? 'medium'}
        required
      >
        {PRICE_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <EnumCheckboxGroup
        title="Meal types"
        name="mealTypes"
        options={MEAL_TYPE_OPTIONS}
        selectedValues={food?.mealTypes}
        ensureOneSelected={ensureMealType}
      />

      <EnumCheckboxGroup
        title="Diet tags"
        name="dietTags"
        options={DIET_TAG_OPTIONS}
        selectedValues={food?.dietTags}
      />

      <EnumCheckboxGroup
        title="Context tags"
        name="contextTags"
        options={CONTEXT_TAG_OPTIONS}
        selectedValues={food?.contextTags}
      />

      <input
        name="ingredientsCsv"
        defaultValue={(Array.isArray(food?.ingredients) ? food?.ingredients : (food?.ingredients as any)?.vi ?? []).join(',')}
        placeholder="Ingredients CSV"
        className="rounded border p-2"
        required
      />

      <input
        name="allergensCsv"
        defaultValue={(food?.allergens ?? []).join(',')}
        placeholder="Allergens CSV"
        className="rounded border p-2"
      />

      <select name="category" className="rounded border p-2" defaultValue={toCategoryValue(food)}>
        <option value="">Không chọn category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {typeof category.name === 'string' ? category.name : category.name?.vi}
          </option>
        ))}
      </select>

      <select
        name="cookingStyle"
        className="rounded border p-2"
        defaultValue={food?.cookingStyle ?? ''}
      >
        <option value="">Không chọn cooking style</option>
        {COOKING_STYLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        name="origin"
        defaultValue={food?.origin ?? ''}
        placeholder="Origin"
        className="rounded border p-2"
      />

      <input
        name="tagsCsv"
        defaultValue={(Array.isArray(food?.tags) ? food?.tags : (food?.tags as any)?.vi ?? []).join(',')}
        placeholder="Tags CSV"
        className="rounded border p-2"
      />

      <FoodImagePreviewInput
        defaultUrl={food?.thumbnailImage ?? food?.images?.[0] ?? ''}
        nameInputId={nameInputId}
      />

      <input
        name="priceMin"
        type="number"
        min={0}
        defaultValue={food?.priceMin ?? ''}
        placeholder="Price min"
        className="rounded border p-2"
      />

      <input
        name="priceMax"
        type="number"
        min={0}
        defaultValue={food?.priceMax ?? ''}
        placeholder="Price max"
        className="rounded border p-2"
      />

      <input
        name="calories"
        type="number"
        min={0}
        defaultValue={food?.calories ?? ''}
        placeholder="Calories"
        className="rounded border p-2"
      />

      <textarea
        name="description"
        defaultValue={typeof food?.description === 'string' ? food.description : (food?.description as any)?.vi ?? ''}
        placeholder="Mô tả"
        className="rounded border p-2 md:col-span-2"
        rows={3}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isActive" defaultChecked={food?.isActive ?? true} />
        Active
      </label>
    </>
  );
}

export default async function FoodsAdminPage({
  searchParams,
}: {
  searchParams?: FoodsPageSearchParams;
}) {
  const [foods, categories] = await Promise.all([fetchFoods(), fetchCategories()]);

  const selectedFoodId =
    typeof searchParams?.foodId === 'string' && searchParams.foodId.trim().length > 0
      ? searchParams.foodId.trim()
      : undefined;

  const mode = searchParams?.mode === 'create' ? 'create' : 'edit';

  let selectedFood: AdminFood | null = null;
  let selectedFoodError: string | undefined;

  if (selectedFoodId && mode !== 'create') {
    try {
      selectedFood = await fetchFoodById(selectedFoodId);
    } catch {
      selectedFoodError = 'Không thể tải thông tin món ăn đã chọn.';
    }
  }

  const statusMessage =
    searchParams?.status && STATUS_MESSAGE_MAP[searchParams.status]
      ? STATUS_MESSAGE_MAP[searchParams.status]
      : undefined;
  const errorMessage = searchParams?.error ?? selectedFoodError;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Quản lý món ăn</h1>

      {statusMessage ? (
        <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          Lỗi: {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded border border-slate-300 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-slate-700">Danh sách món</h2>
            <Link
              href="/?mode=create"
              className="rounded border px-2 py-1 text-xs font-semibold text-slate-700"
            >
              + Tạo mới
            </Link>
          </div>

          <div className="max-h-[72vh] space-y-1 overflow-y-scroll pr-1">
            {foods.map((food) => {
              const active = food._id === selectedFoodId && mode !== 'create';

              return (
                <Link
                  key={food._id}
                  href={`/?foodId=${food._id}`}
                  className={`block rounded border px-2 py-2 text-sm ${
                    active ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{typeof food.name === 'string' ? food.name : food.name?.vi}</p>
                </Link>
              );
            })}

            {foods.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có món ăn nào.</p>
            ) : null}
          </div>
        </aside>

        <article className="rounded border border-slate-300 bg-white p-4">
          {mode === 'create' ? (
            <>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Thêm món mới</h2>
              <form
                key="create-food-form"
                action={createFoodAction}
                className="grid gap-3 md:grid-cols-2"
              >
                <FoodFormFields
                  categories={categories}
                  ensureMealType
                  nameInputId="create-food-name"
                />

                <SubmitButton label="Lưu món mới" />
              </form>
            </>
          ) : selectedFood ? (
            <>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Chỉnh sửa món ăn</h2>

              <form
                key={`edit-food-form-${selectedFood._id}`}
                action={updateFoodAction}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="id" value={selectedFood._id} />
                <FoodFormFields
                  categories={categories}
                  food={selectedFood}
                  ensureMealType
                  nameInputId="edit-food-name"
                />

                <SubmitButton label="Lưu thay đổi" />
              </form>

              <form action={deleteFoodAction} className="mt-3">
                <input type="hidden" name="id" value={selectedFood._id} />
                <SubmitButton label="Xóa món ăn" variant="danger" />
              </form>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-700">
                Chọn một món ăn ở cột bên trái để tải thông tin chi tiết.
              </p>
              <Link
                href="/?mode=create"
                className="inline-block rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Tạo món ăn mới
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
