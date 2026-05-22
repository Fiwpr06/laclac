'use client';

import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

export default function PhonePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative mx-auto w-64 h-[500px] rounded-[3rem] border-[8px] border-brand-secondary bg-white shadow-float overflow-hidden flex flex-col items-center justify-center mt-8 md:mt-0"
    >
      {/* Top notch */}
      <div className="absolute top-0 w-32 h-6 bg-brand-secondary rounded-b-3xl"></div>

      <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-brand-primary" />
        </div>
        <h3 className="font-heading font-bold text-xl text-brand-secondary">
          <span className="text-brand-primary">Lắc</span> Lắc
        </h3>
        <p className="text-sm text-brand-muted">
          Ứng dụng đang chờ được mở qua Expo Go.
        </p>
      </div>
      
      {/* Home indicator */}
      <div className="absolute bottom-2 w-24 h-1 bg-brand-secondary/20 rounded-full"></div>
    </motion.div>
  );
}
