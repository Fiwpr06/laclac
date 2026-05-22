'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

interface DownloadButtonsProps {
  apkUrl?: string;
}

export default function DownloadButtons({ apkUrl }: DownloadButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="flex flex-col sm:flex-row gap-4 mt-8"
    >
      <a
        href={apkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 px-6 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-primaryHover transition-colors shadow-md hover:shadow-lg group"
      >
        <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        Tải file APK (Android)
      </a>
      
      {/* iOS button is hidden as per requirement to only support Android */}
      <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 text-brand-muted rounded-full font-semibold cursor-not-allowed border border-gray-200">
        <Download className="w-5 h-5 opacity-50" />
        iOS (Coming soon)
      </div>
    </motion.div>
  );
}
