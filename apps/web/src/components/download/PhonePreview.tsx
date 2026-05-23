'use client';

import { motion } from 'framer-motion';

export default function PhonePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.4 }}
      className="relative mx-auto w-[280px] h-[580px] rounded-[3rem] border-[10px] border-gray-200 bg-white shadow-float overflow-hidden flex flex-col items-center mt-8 md:mt-0 z-10"
      style={{
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 59, 48, 0.05)',
      }}
    >
      {/* Inner Bezel Glow */}
      <div className="absolute inset-0 border border-gray-100 rounded-[2.5rem] pointer-events-none z-20"></div>

      {/* Screen Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white z-0"></div>

      {/* Dynamic Island / Notch */}
      <div className="absolute top-2 w-[90px] h-[26px] bg-gray-900 rounded-full z-30 flex items-center justify-end px-2">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-700 border border-white/10"></div>
      </div>

      {/* Mockup Content */}
      <div className="relative z-10 flex flex-col w-full h-full p-6 pt-16">
        {/* Fake Header */}
        <div className="flex items-center justify-between w-full mb-8">
          <div className="text-brand-secondary font-semibold text-lg">Lắc Lắc</div>
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-brand-border"></div>
        </div>

        {/* Fake Card */}
        <div className="w-full aspect-[4/5] bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-orange-500/5"></div>
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <div className="w-3/4 h-6 bg-gray-200/50 rounded-md"></div>
            <div className="w-1/2 h-4 bg-gray-100/50 rounded-md"></div>
          </div>
        </div>

        {/* Fake Buttons */}
        <div className="flex gap-4 w-full">
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-brand-border shrink-0"></div>
          <div className="flex-1 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center font-semibold text-sm shadow-md">Lắc Ngay</div>
        </div>
      </div>
      
      {/* Home indicator */}
      <div className="absolute bottom-2 w-1/3 h-1.5 bg-gray-300 rounded-full z-30"></div>
    </motion.div>
  );
}
