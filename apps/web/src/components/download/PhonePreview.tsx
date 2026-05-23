'use client';

import { motion } from 'framer-motion';

export default function PhonePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.4 }}
      className="relative mx-auto w-[280px] h-[580px] rounded-[3rem] border-[10px] border-[#2A2A2A] bg-black shadow-2xl overflow-hidden flex flex-col items-center mt-8 md:mt-0 z-10"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 59, 48, 0.1)',
      }}
    >
      {/* Inner Bezel Glow */}
      <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none z-20"></div>

      {/* Screen Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#1A1A1A] to-[#0A0A0A] z-0"></div>

      {/* Dynamic Island / Notch */}
      <div className="absolute top-2 w-[90px] h-[26px] bg-black rounded-full z-30 flex items-center justify-end px-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10"></div>
      </div>

      {/* Mockup Content */}
      <div className="relative z-10 flex flex-col w-full h-full p-6 pt-16">
        {/* Fake Header */}
        <div className="flex items-center justify-between w-full mb-8">
          <div className="text-white/80 font-semibold text-lg">Lắc Lắc</div>
          <div className="w-10 h-10 rounded-full bg-white/10"></div>
        </div>

        {/* Fake Card */}
        <div className="w-full aspect-[4/5] bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden mb-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <div className="w-3/4 h-6 bg-white/20 rounded-md"></div>
            <div className="w-1/2 h-4 bg-white/10 rounded-md"></div>
          </div>
        </div>

        {/* Fake Buttons */}
        <div className="flex gap-4 w-full">
          <div className="w-14 h-14 rounded-full bg-white/10 shrink-0"></div>
          <div className="flex-1 h-14 rounded-full bg-brand-primary/80 backdrop-blur-md"></div>
        </div>
      </div>
      
      {/* Home indicator */}
      <div className="absolute bottom-2 w-1/3 h-1.5 bg-white/30 rounded-full z-30"></div>
    </motion.div>
  );
}
