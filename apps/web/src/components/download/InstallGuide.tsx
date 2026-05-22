'use client';

import { motion } from 'framer-motion';

export default function InstallGuide() {
  const steps = [
    {
      title: 'Tải file APK',
      description: 'Nhấn nút Tải file APK hoặc quét mã QR bằng điện thoại Android để tải file về máy.',
    },
    {
      title: 'Cấp quyền cài đặt',
      description: 'Nếu điện thoại cảnh báo, hãy vào Cài đặt > Bảo mật và bật "Cho phép cài đặt từ nguồn không xác định".',
    },
    {
      title: 'Cài đặt & Trải nghiệm',
      description: 'Mở file APK vừa tải xuống và tiến hành cài đặt để bắt đầu tìm món ăn ngon với Lắc Lắc!',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-8 space-y-6"
    >
      <h3 className="text-xl font-heading font-bold text-brand-secondary">
        Hướng dẫn cài đặt
      </h3>
      <div className="flex flex-col gap-5">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4 items-start group">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold shrink-0 mt-0.5 group-hover:bg-brand-primary group-hover:text-white transition-colors">
              {index + 1}
            </div>
            <div>
              <h4 className="font-semibold text-brand-secondary">{step.title}</h4>
              <p className="text-brand-muted text-sm mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
