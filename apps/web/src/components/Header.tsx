'use client';

import Link from 'next/link';
import { useSettingsStore } from '../store/settings';
import { useAuthStore } from '../store/auth-store';
import { useEffect, useState } from 'react';

export default function Header() {
  const { language, setLanguage } = useSettingsStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEn = mounted && language === 'en';

  const t = {
    profile: isEn ? 'Profile' : 'Hồ sơ',
    user: isEn ? 'Guest' : 'Khách',
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-border w-full">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-heading font-extrabold text-brand-secondary tracking-tight"
        >
          <span className="text-brand-primary">Lắc</span> Lắc
        </Link>

        {/* Action Right */}
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setLanguage(isEn ? 'vi' : 'en')}
              className="px-2.5 py-1 text-xs font-bold border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
            >
              {isEn ? 'EN' : 'VI'}
            </button>
          )}
          <Link href={user ? '/profile' : '/login'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand-muted"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <span className="font-semibold text-sm hidden md:block text-brand-secondary group-hover:text-brand-primary transition-colors">
              {user ? user.name : t.user}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
