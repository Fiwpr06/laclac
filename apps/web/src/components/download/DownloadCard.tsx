'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Globe, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface DownloadCardProps {
  apkUrl?: string;
}

export default function DownloadCard({ apkUrl }: DownloadCardProps) {
  const [activeTab, setActiveTab] = useState<'android' | 'web'>('android');
  const webUrl = 'https://laclac-web.vercel.app/';

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Tab Selector */}
      <div className="flex p-1 bg-white rounded-2xl mb-8 border border-brand-border shadow-sm relative z-10">
        <button
          onClick={() => setActiveTab('android')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'android' ? 'text-white' : 'text-brand-muted hover:text-brand-secondary'
          }`}
        >
          {activeTab === 'android' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-brand-primary rounded-xl shadow-md shadow-brand-primary/20"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Smartphone className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Android APK</span>
        </button>
        <button
          onClick={() => setActiveTab('web')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'web' ? 'text-white' : 'text-brand-muted hover:text-brand-secondary'
          }`}
        >
          {activeTab === 'web' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-[#007AFF] rounded-xl shadow-md shadow-[#007AFF]/20"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Globe className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Web App</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="relative group">
        {/* Glow behind card */}
        <div className={`absolute -inset-1.5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition duration-1000 ${
          activeTab === 'android' ? 'bg-brand-primary' : 'bg-[#007AFF]'
        }`} />
        
        {/* Card */}
        <div className="relative bg-white/90 backdrop-blur-xl border border-brand-border rounded-3xl p-8 shadow-xl flex flex-col items-center min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === 'android' ? (
              <motion.div
                key="android"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-heading font-bold text-brand-secondary mb-1">Tải Ứng Dụng</h3>
                  <p className="text-brand-muted text-sm">Quét mã để tải file APK trực tiếp</p>
                </div>

                <div className="p-4 bg-white rounded-3xl shadow-sm border border-brand-border mb-6">
                  {apkUrl ? (
                    <QRCodeSVG value={apkUrl} size={180} bgColor={"#ffffff"} fgColor={"#1A1A1A"} level={"H"} includeMargin={false} />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 rounded-2xl">
                      <span className="text-gray-400 text-sm">Chưa có link tải</span>
                    </div>
                  )}
                </div>

                <a
                  href={apkUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-brand-primaryHover transition-colors shadow-md group"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  Tải Ngay
                </a>

                <div className="mt-8 w-full space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Lưu ý: Bạn cần cấp quyền <strong className="text-brand-secondary">&quot;Cài đặt ứng dụng không rõ nguồn gốc&quot;</strong> trong cài đặt Bảo mật để cài file APK.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="web"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center justify-center h-full pt-4"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-heading font-bold text-brand-secondary mb-1">Trải Nghiệm Web</h3>
                  <p className="text-brand-muted text-sm">Không cần cài đặt, dùng ngay lập tức</p>
                </div>

                <div className="p-4 bg-white rounded-3xl shadow-sm border border-brand-border mb-8">
                  <QRCodeSVG value={webUrl} size={180} bgColor={"#ffffff"} fgColor={"#1A1A1A"} level={"H"} includeMargin={false} />
                </div>

                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-[#007AFF] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0066D6] transition-colors shadow-md group"
                >
                  Mở Trang Web
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
