'use client';

import { useSettingsStore } from '../../src/store/settings';
import { useFilters } from '../../src/store/filters';
import { WebFilter } from '../../src/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../src/store/auth-store';

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

export default function ProfilePage(): JSX.Element | null {
  const settings = useSettingsStore();
  const { filters } = useFilters();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  if (!mounted) return null;

  const isEn = settings.language === 'en';

  const t = {
    title: isEn ? 'User Settings & Profile' : 'Cài đặt & Hồ sơ',
    desc: isEn
      ? 'Manage your application preferences and diet profile.'
      : 'Quản lý tùy chọn ứng dụng và hồ sơ ăn uống của bạn.',
    system: isEn ? 'System Preferences' : 'Tùy chọn hệ thống',
    haptic: isEn ? 'Haptic Feedback (Mobile/PWA)' : 'Phản hồi rung (Mobile/PWA)',
    sound: isEn ? 'Application Sounds' : 'Âm thanh ứng dụng',
    reduceMotion: isEn ? 'Reduce Motion' : 'Giảm chuyển động',
    language: isEn ? 'English Interface' : 'Giao diện Tiếng Anh',
    tasteProfile: isEn ? 'Taste Profile (Debugging)' : 'Hồ sơ khẩu vị (Gỡ lỗi)',
    activeFilters: isEn ? 'Active Filters' : 'Điều kiện đang bật',
    price: isEn ? 'Price Range' : 'Mức giá',
    cuisine: isEn ? 'Cuisine' : 'Ẩm thực',
    diet: isEn ? 'Diet' : 'Chế độ ăn',
    allergens: isEn ? 'Excluded Allergens' : 'Dị ứng loại trừ',
  };

  const toListText = (values?: string | string[]) => {
    if (!values || values.length === 0) return isEn ? 'None' : 'Chưa có';
    if (typeof values === 'string') return values;
    return Array.isArray(values) ? values.join(', ') : isEn ? 'None' : 'Chưa có';
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-brand-secondary mb-2">
          {t.title}
        </h1>
        <p className="text-brand-muted">{t.desc}</p>
      </div>

      {user && (
        <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              {user.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🧑‍🍳</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border">
          <h2 className="text-xl font-bold mb-6 text-brand-secondary">{t.system}</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{t.language}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEn}
                  onChange={(e) => settings.setLanguage(e.target.checked ? 'en' : 'vi')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pointer-events-none opacity-50">
              <div>
                <div className="font-semibold text-gray-800">{t.haptic}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.hapticEnabled}
                  onChange={(e) => settings.setHaptic(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pointer-events-none opacity-50">
              <div>
                <div className="font-semibold text-gray-800">{t.sound}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.soundEnabled}
                  onChange={(e) => settings.setSound(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{t.reduceMotion}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.reduceMotion}
                  onChange={(e) => settings.setReduceMotion(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Filters Summary Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-brand-border">
          <h2 className="text-xl font-bold mb-6 text-brand-secondary">{t.tasteProfile}</h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-medium">{t.activeFilters}</span>
              <span className="font-bold text-gray-900">{countActiveFilters(filters)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-medium">{t.price}</span>
              <span className="text-gray-900">
                {filters.priceRange || (isEn ? 'Any' : 'Mọi mức giá')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-medium">{t.cuisine}</span>
              <span className="text-gray-900 max-w-[200px] text-right truncate">
                {toListText(filters.cuisineType)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-medium">{t.diet}</span>
              <span className="text-gray-900">{toListText(filters.dietTag)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-medium">{t.allergens}</span>
              <span className="text-gray-900">{toListText(filters.allergenExclude)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
