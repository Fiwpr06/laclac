'use client';

import Link from 'next/link';

import { WebFilter } from '../../src/lib/api';
import { useFilters } from '../../src/store/filters';

type Option<T extends string> = {
  readonly value: T;
  readonly label: string;
};

const PRICE_OPTIONS = [
  { value: 'cheap', label: 'Tiết kiệm' },
  { value: 'medium', label: 'Cân bằng' },
  { value: 'expensive', label: 'Thoải mái' },
] as const;

const BUDGET_OPTIONS = [
  { value: 'under_30k', label: 'Dưới 30k' },
  { value: 'from_30k_to_50k', label: '30k - 50k' },
  { value: 'from_50k_to_100k', label: '50k - 100k' },
  { value: 'over_100k', label: 'Trên 100k' },
] as const;

const DISH_OPTIONS = [
  { value: 'liquid', label: 'Nước' },
  { value: 'dry', label: 'Khô' },
  { value: 'fried_grilled', label: 'Chiên / Nướng' },
] as const;

const CUISINE_OPTIONS = [
  { value: 'vietnamese', label: 'Việt Nam' },
  { value: 'asian', label: 'Châu Á' },
  { value: 'european', label: 'Châu Âu' },
] as const;

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Sáng' },
  { value: 'lunch', label: 'Trưa' },
  { value: 'dinner', label: 'Tối' },
  { value: 'snack', label: 'Ăn vặt' },
] as const;

const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Ăn chay' },
  { value: 'vegan', label: 'Thuần chay' },
  { value: 'keto', label: 'Keto' },
  { value: 'clean', label: 'Eat clean' },
] as const;

const COOKING_OPTIONS = [
  { value: 'soup', label: 'Canh / Súp' },
  { value: 'dry', label: 'Khô' },
  { value: 'fried', label: 'Chiên' },
  { value: 'grilled', label: 'Nướng' },
  { value: 'raw', label: 'Tươi / Sống' },
  { value: 'steamed', label: 'Hấp' },
] as const;

const CONTEXT_OPTIONS = [
  { value: 'solo', label: 'Một mình' },
  { value: 'date', label: 'Hẹn hò' },
  { value: 'group', label: 'Nhóm bạn' },
  { value: 'travel', label: 'Đi chơi' },
  { value: 'office', label: 'Công sở' },
] as const;

const pillBase =
  'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40';

const pillClass = (isActive: boolean): string => {
  if (isActive) {
    return `${pillBase} border-brand-primary bg-brand-primary text-white`;
  }

  return `${pillBase} border-brand-secondary/20 bg-white text-brand-secondary hover:border-brand-primary/40`;
};

const countActiveFilters = (filters: WebFilter): number => {
  const scalarCount = [
    filters.priceRange,
    filters.budgetBucket,
    filters.dishType,
    filters.cuisineType,
    filters.category,
    filters.mealType,
    filters.dietTag,
    filters.cookingStyle,
    filters.context,
  ].filter(Boolean).length;

  return scalarCount + ((filters.allergenExclude?.length ?? 0) > 0 ? 1 : 0);
};

function ToggleGroup<T extends string>({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: ReadonlyArray<Option<T>>;
  value?: T;
  onSelect: (value?: T) => void;
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-bold text-brand-secondary">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              onClick={() => {
                try {
                  const tickAudio = new Audio('/sounds/tick-filter.mp3');
                  tickAudio.volume = 0.5;
                  tickAudio.play().catch(() => {});
                } catch (e) {}
                onSelect(active ? undefined : item.value);
              }}
              className={pillClass(active)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterPage(): JSX.Element {
  const { filters, setFilter, reset } = useFilters();
  const activeFilterCount = countActiveFilters(filters);
  const allergenText = (filters.allergenExclude ?? []).join(', ');

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black text-brand-secondary">Bộ lọc thông minh</h1>
      <p className="text-brand-secondary/70">
        Chọn nhanh theo ngân sách, kiểu món, ẩm thực, bữa ăn và ngữ cảnh trước khi lắc.
      </p>

      <p className="text-sm font-semibold text-brand-secondary/70">
        Đang bật {activeFilterCount} điều kiện lọc.
      </p>

      <div className="lac-card space-y-6 p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <ToggleGroup
            title="Khoảng giá"
            options={PRICE_OPTIONS}
            value={filters.priceRange}
            onSelect={(value) => setFilter('priceRange', value)}
          />

          <ToggleGroup
            title="Ngân sách chi tiết"
            options={BUDGET_OPTIONS}
            value={filters.budgetBucket}
            onSelect={(value) => setFilter('budgetBucket', value)}
          />

          <ToggleGroup
            title="Loại món"
            options={DISH_OPTIONS}
            value={filters.dishType}
            onSelect={(value) => setFilter('dishType', value)}
          />

          <ToggleGroup
            title="Kiểu ẩm thực"
            options={CUISINE_OPTIONS}
            value={filters.cuisineType}
            onSelect={(value) => setFilter('cuisineType', value)}
          />

          <ToggleGroup
            title="Bữa ăn"
            options={MEAL_OPTIONS}
            value={filters.mealType}
            onSelect={(value) => setFilter('mealType', value)}
          />

          <ToggleGroup
            title="Chế độ dinh dưỡng"
            options={DIET_OPTIONS}
            value={filters.dietTag}
            onSelect={(value) => setFilter('dietTag', value)}
          />

          <ToggleGroup
            title="Kiểu nấu"
            options={COOKING_OPTIONS}
            value={filters.cookingStyle}
            onSelect={(value) => setFilter('cookingStyle', value)}
          />

          <ToggleGroup
            title="Ngữ cảnh"
            options={CONTEXT_OPTIONS}
            value={filters.context}
            onSelect={(value) => setFilter('context', value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-brand-secondary">Dị ứng cần loại trừ</h2>
          <input
            value={allergenText}
            onChange={(event) => {
              const next = event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

              setFilter('allergenExclude', next.length > 0 ? next : undefined);
            }}
            placeholder="Ví dụ: đậu phộng, tôm, sữa"
            className="w-full rounded-xl border border-brand-secondary/20 bg-white px-4 py-2 text-sm text-brand-secondary outline-none transition focus:border-brand-primary"
          />
          <p className="text-xs text-brand-secondary/60">
            Tách bằng dấu phẩy để loại trừ nhiều dị ứng.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-brand-secondary">Category ID (nâng cao)</h2>
          <input
            value={filters.category ?? ''}
            onChange={(event) => {
              const next = event.target.value.trim();
              setFilter('category', next || undefined);
            }}
            placeholder="ObjectId category nếu cần khóa cứng theo danh mục"
            className="w-full rounded-xl border border-brand-secondary/20 bg-white px-4 py-2 text-sm text-brand-secondary outline-none transition focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-secondary px-4 py-2 font-bold text-white"
          >
            Reset toàn bộ
          </button>
          <Link
            href="/"
            className="rounded-xl border border-brand-primary/30 bg-orange-50 px-4 py-2 font-bold text-brand-primary"
          >
            Quay lại màn lắc
          </Link>
        </div>
      </div>
    </section>
  );
}
