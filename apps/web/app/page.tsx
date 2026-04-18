'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  FoodItem,
  WebFilter,
  getSwipeQueue,
  postAction,
  postShake,
  toActionFilterSnapshot,
} from '../src/lib/api';
import { useFilters } from '../src/store/filters';
import { useSettingsStore } from '../src/store/settings';
import { useHistoryStore } from '../src/store/history';
import { tPriceRange } from '../src/lib/translate';

const getSessionId = (): string => {
  const key = 'laclac_web_session';
  const existing = globalThis.localStorage?.getItem(key);
  if (existing) return existing;

  const id = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  globalThis.localStorage?.setItem(key, id);
  return id;
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

const getFilterSignature = (filters: WebFilter): string => {
  return JSON.stringify({
    ...filters,
    allergenExclude: [...(filters.allergenExclude ?? [])].sort(),
  });
};

const mergeUniqueFoods = (current: FoodItem[], incoming: FoodItem[]): FoodItem[] => {
  if (incoming.length === 0) return current;
  const existingIds = new Set(current.map((item) => item._id));
  const merged = [...current];
  for (const item of incoming) {
    if (!existingIds.has(item._id)) {
      merged.push(item);
      existingIds.add(item._id);
    }
  }
  return merged;
};

const getFoodImageUrl = (food: FoodItem): string => {
  const url = food.thumbnailImage || (food.images && food.images[0]) || '';
  if (!url) return '';
  if (url.startsWith('data:image/') || url.startsWith('http')) return url;
  return `/${url}`;
};

export default function HomePage() {
  const { filters } = useFilters();
  const { language } = useSettingsStore();
  const isEn = language === 'en';

  const [food, setFood] = useState<FoodItem | null>(null);
  const [queue, setQueue] = useState<FoodItem[]>([]);
  const { history, addHistory, clearHistory } = useHistoryStore();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  const queueLoadingRef = useRef(false);
  const queueSignatureRef = useRef('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const filterSignature = useMemo(() => getFilterSignature(filters), [filters]);

  const t = {
    flexible: isEn ? 'Flexible' : 'Linh hoạt',
    activeFiltersStr: isEn ? 'Active Filters' : 'Điều kiện lọc',
    filterDesc: isEn
      ? 'Refine the pool that Lắc will pick from'
      : 'Thu hẹp phạm vi chọn món của Lắc Lắc',
    cuisine: isEn ? 'Cuisine' : 'Loại Ẩm thực',
    price: isEn ? 'Price Range' : 'Khoảng Giá',
    anyPrice: isEn ? 'Any price' : 'Mọi mức giá',
    allergens: isEn ? 'Allergens' : 'Dị Ứng',
    mealType: isEn ? 'Meal Time' : 'Bữa ăn',
    diet: isEn ? 'Diet Preferences' : 'Chế độ ăn',
    editFilters: isEn ? 'Edit Filters' : 'Sửa Bộ Lọc',
    shakeTitle: isEn ? 'Shake & Discover' : 'Lắc & Khám Phá',
    shakeDesc: isEn
      ? 'Press the big Lắc button below or press Space to simulate shaking. Each shake pulls a random dish from your current filters.'
      : 'Nhấn nút Lắc lớn bên dưới hoặc phím Space để mô phỏng lắc. Mỗi lần lắc sẽ chọn ngẫu nhiên một món ăn phù hợp với bộ lọc.',
    shakeBtn: isEn ? 'Shake!' : 'Lắc',
    spaceHint: isEn ? 'Press Shake or Space' : 'Nhấn Lắc hoặc phím Space',
    currentPool: isEn ? 'Current Pool' : 'Kho Món Ăn',
    poolCountInfo: (len: number) => {
      if (len > 5) return isEn ? 'Hundreds of matching dishes' : 'Đang có hàng trăm món phù hợp';
      return isEn ? `${len} matching dishes` : `Đang có ${len} món phù hợp`;
    },
    noFilters: isEn ? 'No active filters' : 'Chưa có bộ lọc nào',
    apiError: isEn
      ? 'Failed to fetch food from service. Please try again.'
      : 'Không kết nối được dịch vụ món ăn. Vui lòng thử lại.',
    noImage: isEn ? 'No image' : 'Không có ảnh',
    dish: isEn ? 'Dish' : 'Món ăn',
    main: isEn ? 'Main' : 'Món chính',
    accept: isEn ? 'Favorite' : 'Yêu thích',
    details: isEn ? 'View Details' : 'Xem chi tiết',
    shakeWait: isEn ? 'Shake to show meals...' : 'Lắc để hiển thị món ăn...',
    historyTitle: isEn ? 'Shake History' : 'Lịch Sử Lắc',
    historyDesc: isEn ? 'Last 10 results' : '10 món gần nhất',
    clearBtn: isEn ? 'Clear' : 'Xóa',
    historyEmpty: isEn
      ? 'History is empty. Shake to get started!'
      : 'Lịch sử trống. Hãy thử lắc nhé!',
    viewFullHistory: isEn ? 'View Full History' : 'Xem toàn bộ',
    saveBtn: isEn ? 'Save' : 'Lưu',
  };

  const formatList = (items?: string | string[]): string => {
    if (!items || items.length === 0) return t.flexible;
    if (typeof items === 'string') return items;
    return Array.isArray(items) ? items.join(', ') : t.flexible;
  };

  const safeArray = (items?: string | string[]): string[] => {
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  };

  const warmQueue = useCallback(async (signature: string, activeFilters: WebFilter) => {
    if (queueLoadingRef.current) return;
    queueLoadingRef.current = true;
    try {
      const incoming = await getSwipeQueue(activeFilters);
      if (incoming.length === 0 || queueSignatureRef.current !== signature) return;
      setQueue((current) => mergeUniqueFoods(current, incoming));
    } catch (error) {
      console.error('Failed to warm web shake queue', error);
    } finally {
      queueLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    queueSignatureRef.current = filterSignature;
    setQueue([]);
    void warmQueue(filterSignature, filters);
  }, [filterSignature, filters, warmQueue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Just check the code, call shakeNow which we will define soon.
      // We don't depend on shakeNow for the reference.
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        // By emitting an event, we avoid dependency issues. Or we can just use the global state.
        const btn = document.getElementById('shake-button');
        if (btn) btn.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shakeNow = async () => {
    if (loading) return;

    const signature = filterSignature;
    const activeFilters: WebFilter = {
      ...filters,
      allergenExclude: filters.allergenExclude ? [...filters.allergenExclude] : undefined,
    };
    const sessionId = getSessionId();

    setLoading(true);
    try {
      const shakeAudio = new Audio('/sounds/shake.mp3');
      shakeAudio.volume = 0.5;
      shakeAudio.play().catch(() => {});
    } catch (e) {}
    setErrorText(undefined);

    try {
      let selectedFood: FoodItem | null = null;
      let nextQueue = queue;

      if (queue.length > 0) {
        selectedFood = queue[0] ?? null;
        nextQueue = queue.slice(1);
      } else {
        const freshQueue = await getSwipeQueue(activeFilters);
        if (freshQueue.length > 0) {
          selectedFood = freshQueue[0] ?? null;
          nextQueue = mergeUniqueFoods([], freshQueue.slice(1));
        } else {
          const result = await postShake({
            sessionId,
            triggerType: 'button',
            context: activeFilters.context,
            filters: activeFilters,
          });
          selectedFood = result.food;
        }
      }

      if (queueSignatureRef.current !== signature) return;

      if (selectedFood) {
        try {
          const tingAudio = new Audio('/sounds/ting.mp3');
          tingAudio.volume = 1.0;
          tingAudio.play().catch(() => {});
        } catch (e) {}
        setFood(selectedFood);
        addHistory(selectedFood!);
      } else {
        try {
          const falseAudio = new Audio('/sounds/false.mp3');
          falseAudio.volume = 0.5;
          falseAudio.play().catch(() => {});
        } catch (e) {}
        setErrorText(t.apiError); // Set error if no food found
      }
      setQueue(nextQueue);

      void postAction({
        sessionId,
        foodId: selectedFood?._id,
        actionType: 'shake_result',
        context: activeFilters.context ?? 'none',
        triggerType: 'button',
        filterSnapshot: toActionFilterSnapshot(activeFilters),
      }).catch(console.error);

      if (nextQueue.length <= 2) {
        void warmQueue(signature, activeFilters);
      }
    } catch (error) {
      console.error(error);
      try {
        const falseAudio = new Audio('/sounds/false.mp3');
        falseAudio.volume = 0.5;
        falseAudio.play().catch(() => {});
      } catch (e) {}
      setErrorText(t.apiError);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6 md:gap-8 items-start">
      {/* LEFT PANEL: Active Filters */}
      <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border">
        <h2 className="text-lg font-bold mb-1 text-brand-secondary">{t.activeFiltersStr}</h2>
        <p className="text-sm text-brand-muted mb-6">{t.filterDesc}</p>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t.cuisine}</div>
              <div className="text-xs text-gray-500 mt-1">{formatList(filters.cuisineType)}</div>
            </div>
            <div className="w-4 h-4 rounded-sm border border-gray-300 bg-white" />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t.price}</div>
              <div className="text-xs text-gray-500 mt-1">
                {filters.priceRange ? tPriceRange(filters.priceRange, isEn) : t.anyPrice}
              </div>
            </div>
            <div className="w-4 h-4 rounded-sm border border-gray-300 bg-white" />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t.allergens}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatList(filters.allergenExclude)}
              </div>
            </div>
            <div className="w-4 h-4 rounded-sm border border-gray-300 bg-white" />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t.mealType}</div>
              <div className="text-xs text-gray-500 mt-1">{formatList(filters.mealType)}</div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t.diet}</div>
              <div className="text-xs text-gray-500 mt-1">{formatList(filters.dietTag)}</div>
            </div>
          </div>
        </div>

        <Link
          href="/filter"
          className="mt-6 w-full py-3 bg-brand-primary text-white rounded-xl font-semibold flex items-center justify-center hover:bg-brand-primaryHover transition-colors shadow-sm"
        >
          {t.editFilters}
        </Link>
      </div>

      {/* CENTER PANEL: Shake Area */}
      <div className="bg-white rounded-2xl shadow-card p-8 border border-brand-border flex flex-col items-center min-h-[600px] relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold text-brand-secondary mb-3">
            {t.shakeTitle}
          </h1>
          <p className="text-brand-muted text-sm max-w-sm mx-auto">{t.shakeDesc}</p>
        </div>

        {/* Shake Button Section */}
        <div className="flex flex-col items-center mb-10 w-full">
          <div className="flex flex-col xl:flex-row items-center gap-8 w-full max-w-2xl mx-auto justify-center">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={shakeNow}
                disabled={loading}
                className="w-32 h-32 rounded-full bg-brand-primary text-white font-bold text-2xl shadow-[0_8px_30px_rgba(255,59,48,0.3)] hover:shadow-[0_8px_30px_rgba(255,59,48,0.45)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="font-heading tracking-tight">{t.shakeBtn}</span>
                )}
              </button>
              <span className="text-sm text-gray-500 font-medium">{t.spaceHint}</span>
            </div>

            <div className="flex-1 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 w-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">{t.currentPool}</span>
                <span className="text-xs text-gray-400">{t.poolCountInfo(queue.length)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {safeArray(filters.cuisineType).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600"
                  >
                    {c}
                  </span>
                ))}
                {safeArray(filters.dietTag).map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600"
                  >
                    {d}
                  </span>
                ))}
                {filters.priceRange && (
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                    {tPriceRange(filters.priceRange, isEn)}
                  </span>
                )}
                {activeFilterCount === 0 && (
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-400 italic">
                    {t.noFilters}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {errorText && (
          <div className="p-4 bg-red-50 text-red-500 rounded-xl mb-6 text-sm">{errorText}</div>
        )}

        {/* Display Match */}
        {food ? (
          <div className="w-full max-w-2xl bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="relative w-full md:w-56 h-56 bg-gray-100 shrink-0">
              {getFoodImageUrl(food) ? (
                <Image src={getFoodImageUrl(food)} alt={food.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  {t.noImage}
                </div>
              )}
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start gap-4 mb-1">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{food.name}</h3>
                  <span className="font-semibold text-lg text-brand-primary shrink-0">
                    {tPriceRange(food.priceRange, isEn)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2 mb-4">
                  <span>
                    {typeof food.category === 'string' ? t.dish : food.category?.name || t.dish}
                  </span>
                  <span>•</span>
                  <span>{t.main}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {food.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {food.description && (
                  <p className="text-sm text-gray-600 mb-6 italic border-l-2 border-brand-primary pl-3 bg-gray-50 py-2 pr-2 rounded-r-md">
                    {food.description}
                  </p>
                )}

                {(food as any).ingredients && ((food as any).ingredients as any[]).length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      {isEn ? 'Ingredients' : 'Nguyên liệu'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {((food as any).ingredients as any[]).slice(0, 8).map((ing: any) => (
                        <span
                          key={ing}
                          className="px-2 py-1 bg-brand-surface border border-brand-border rounded text-[11px] text-gray-600"
                        >
                          {ing}
                        </span>
                      ))}
                      {((food as any).ingredients as any[]).length > 8 && (
                        <span className="px-2 py-1 text-[11px] text-gray-400">
                          +{(food as any).ingredients.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 bg-brand-primary text-white py-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-brand-primaryHover transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {t.accept}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl h-56 bg-gray-50 border border-gray-100 border-dashed rounded-2xl flex items-center justify-center text-gray-400">
            {t.shakeWait}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Shake History */}
      <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border block">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-brand-secondary leading-tight">
              {t.historyTitle}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">{t.historyDesc}</p>
          </div>
          <button
            onClick={clearHistory}
            className="text-xs px-3 py-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
          >
            {t.clearBtn}
          </button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.slice(0, 10).map((hItem, idx) => (
              <div key={`${hItem._id}-${idx}`} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-100">
                  {getFoodImageUrl(hItem) && (
                    <Image
                      src={getFoodImageUrl(hItem)}
                      alt={hItem.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={hItem.name}>
                    {hItem.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {tPriceRange(hItem.priceRange, isEn)} •{' '}
                    {typeof hItem.category === 'string' ? t.dish : hItem.category?.name || t.dish}
                  </p>
                </div>
                <button className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold hover:bg-brand-primary/20 shrink-0">
                  {t.saveBtn}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">{t.historyEmpty}</div>
        )}

        {history.length > 0 && (
          <Link
            href="/history"
            className="block text-center w-full mt-6 py-2.5 text-sm font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors"
          >
            {t.viewFullHistory}
          </Link>
        )}
      </div>
    </div>
  );
}
