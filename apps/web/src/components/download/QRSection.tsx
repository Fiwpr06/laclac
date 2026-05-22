'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, AlertTriangle, Globe, Smartphone } from 'lucide-react';

interface QRSectionProps {
  expoUrl?: string;
}

export default function QRSection({ expoUrl }: QRSectionProps) {
  const [copied, setCopied] = useState(false);
  const webUrl = 'https://laclac-web.vercel.app/';

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
      className="w-full flex flex-col sm:flex-row gap-6 justify-center"
    >
      {/* Mobile QR Card */}
      <div className="relative group w-full max-w-[280px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-orange-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative h-full bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-heading font-bold text-brand-secondary">Mobile App</h2>
            </div>
            <p className="text-brand-muted text-xs">Scan bằng Expo Go</p>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-sm border border-brand-border">
            {expoUrl ? (
              <QRCodeSVG value={expoUrl} size={160} bgColor={"#ffffff"} fgColor={"#1A1A1A"} level={"H"} includeMargin={false} />
            ) : (
              <div className="w-[160px] h-[160px] flex items-center justify-center bg-gray-50 rounded-xl text-center p-4">
                <span className="text-brand-muted text-xs font-medium">Chưa cấu hình</span>
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-2">
            {expoUrl && (
              <button onClick={handleCopy} className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 border border-brand-border rounded-full text-brand-secondary font-medium transition-colors text-xs">
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-green-600">Đã copy</span></>
                ) : (
                  <><Copy className="w-4 h-4 text-brand-muted" /><span>Copy URL</span></>
                )}
              </button>
            )}

            {isLocalIp && (
              <div className="flex items-start gap-1.5 p-2 bg-orange-50 border border-orange-100 rounded-lg w-full">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-[10px] text-orange-700 leading-tight">Cần chung WiFi để quét.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Website QR Card */}
      <div className="relative group w-full max-w-[280px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative h-full bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-heading font-bold text-brand-secondary">Website</h2>
            </div>
            <p className="text-brand-muted text-xs">Truy cập trên trình duyệt</p>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-sm border border-brand-border">
            <QRCodeSVG value={webUrl} size={160} bgColor={"#ffffff"} fgColor={"#1A1A1A"} level={"H"} includeMargin={false} />
          </div>
          
          <div className="flex items-center justify-center w-full pt-2">
            <a href={webUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline break-all text-center">
              laclac-web.vercel.app
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
