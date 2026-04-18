import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AdminToast from '../src/components/AdminToast';

import './globals.css';

export const metadata: Metadata = {
  title: 'Lắc Lắc Admin',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-black text-orange-500">
              🍜 Lắc Lắc Admin
            </Link>
            <nav className="flex gap-4 text-sm font-semibold text-slate-700">
              <Link href="/" className="hover:text-orange-500 transition-colors">🍽️ Món ăn</Link>
              <Link href="/categories" className="hover:text-orange-500 transition-colors">📂 Danh mục</Link>
              <Link href="/foods" className="hover:text-orange-500 transition-colors">🔧 Quản lý</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Suspense>
          <AdminToast />
        </Suspense>
      </body>
    </html>
  );
}

