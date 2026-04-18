'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useHistoryStore } from '../../src/store/history';
import { useSettingsStore } from '../../src/store/settings';
import { tPriceRange } from '../../src/lib/translate';
import { FoodItem } from '../../src/lib/api';

const getFoodImageUrl = (food: FoodItem): string => {
  const url = food.thumbnailImage || (food.images && food.images[0]) || '';
  if (!url) return '';
  if (url.startsWith('data:image/') || url.startsWith('http')) return url;
  return `/${url}`;
};

export default function HistoryPage(): JSX.Element {
  const { history, clearHistory } = useHistoryStore();
  const { language } = useSettingsStore();
  const isEn = language === 'en';

  const t = {
    title: isEn ? 'Full Shake History' : 'Toàn bộ Lịch Sử Lắc',
    desc: isEn ? 'Your recently discovered dishes' : 'Những món ăn bạn đã tìm thấy gần đây',
    clearBtn: isEn ? 'Clear All' : 'Xóa tất cả',
    backBtn: isEn ? 'Back to Shake' : 'Quay lại màn lắc',
    historyEmpty: isEn ? 'History is empty. Shake to get started!' : 'Lịch sử trống. Hãy thử lắc nhé!',
    dish: isEn ? 'Dish' : 'Món ăn',
    saveBtn: isEn ? 'Save' : 'Lưu',
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-brand-secondary mb-2">
            {t.title}
          </h1>
          <p className="text-brand-muted">{t.desc}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearHistory}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            {t.clearBtn}
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-bold rounded-xl border border-brand-primary/30 bg-orange-50 text-brand-primary transition-colors"
          >
            {t.backBtn}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((hItem, idx) => (
              <div
                key={`${hItem._id}-${idx}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  {getFoodImageUrl(hItem) ? (
                    <Image
                      src={getFoodImageUrl(hItem)}
                      alt={hItem.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 truncate" title={hItem.name}>
                    {hItem.name}
                  </h4>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {tPriceRange(hItem.priceRange, isEn)} •{' '}
                    {typeof hItem.category === 'string' ? t.dish : hItem.category?.name || t.dish}
                  </p>
                </div>
                <button className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl text-sm font-bold hover:bg-brand-primary/20 shrink-0">
                  {t.saveBtn}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🫙</span>
            </div>
            <p className="text-gray-500 font-medium">{t.historyEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
