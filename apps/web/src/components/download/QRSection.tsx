'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface QRSectionProps {
  expoUrl?: string;
}

export default function QRSection({ expoUrl }: QRSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (expoUrl) {
      navigator.clipboard.writeText(expoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLocalIp = expoUrl?.includes('192.168.') || expoUrl?.includes('localhost') || expoUrl?.includes('10.');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-orange-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Glassmorphism Card */}
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-heading font-bold text-brand-secondary">
              Scan bằng Expo Go
            </h2>
            <p className="text-brand-muted text-sm">
              Sử dụng điện thoại Android để quét
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-brand-border">
            {expoUrl ? (
              <QRCodeSVG
                value={expoUrl}
                size={240}
                bgColor={"#ffffff"}
                fgColor={"#1A1A1A"}
                level={"H"}
                includeMargin={false}
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-50 rounded-xl text-center p-4">
                <span className="text-brand-muted text-sm font-medium">
                  Expo URL chưa được cấu hình
                </span>
              </div>
            )}
          </div>

          {expoUrl && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-brand-border rounded-full text-brand-secondary font-medium transition-colors text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Đã copy URL</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-brand-muted" />
                  <span>Copy Expo URL</span>
                </>
              )}
            </button>
          )}

          {isLocalIp && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl w-full">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                <span className="font-semibold block mb-1">Cảnh báo mạng cục bộ</span>
                Điện thoại và máy tính phải kết nối cùng chung một mạng WiFi để tải ứng dụng.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
