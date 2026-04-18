import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import Header from '../src/components/Header';

import './globals.css';

const headingFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const bodyFont = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Lắc Lắc | Tìm món ăn',
  description: 'Khám phá món ăn ngẫu nhiên.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} bg-brand-background text-brand-secondary font-body antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
