import { Metadata } from 'next';
import PhonePreview from '../../src/components/download/PhonePreview';
import DownloadCard from '../../src/components/download/DownloadCard';

export const metadata: Metadata = {
  title: 'Trải nghiệm Lắc Lắc | App & Web',
  description: 'Khám phá ẩm thực mỗi ngày với Lắc Lắc. Tải ứng dụng hoặc trải nghiệm ngay trên trình duyệt.',
  openGraph: {
    title: 'Trải nghiệm Lắc Lắc',
    description: 'Ứng dụng tìm món ăn ngẫu nhiên siêu mượt.',
    type: 'website',
  },
};

export default function DownloadPage() {
  const apkUrl = process.env['NEXT_PUBLIC_APK_URL'];

  return (
    <div className="min-h-screen w-full flex flex-col pt-12 pb-24 relative overflow-hidden bg-[#0A0A0A]">
      {/* Background decoration - Dark Mode */}
      <div className="absolute top-0 inset-x-0 h-screen bg-gradient-to-b from-brand-primary/10 via-[#0A0A0A] to-[#0A0A0A] -z-10" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto w-full px-6 lg:px-8 flex flex-col lg:flex-row gap-16 lg:gap-24 items-center justify-between relative z-10">
        
        {/* LEFT SIDE - Hero Copy & Phone */}
        <div className="flex-1 w-full flex flex-col items-center lg:items-start order-2 lg:order-1 mt-8 lg:mt-0">
          <div className="space-y-6 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-primary font-medium text-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              Phiên bản mới nhất
            </div>
            
            <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight">
              Hôm nay <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-400">
                ăn gì?
              </span>
            </h1>
            
            <p className="text-lg text-white/60 leading-relaxed">
              Dừng việc suy nghĩ lại. Hãy để Lắc Lắc chọn giúp bạn một món ăn ngon ngẫu nhiên ngay hôm nay. Trải nghiệm mượt mà trên Mobile App hoặc tiện lợi ngay trên Web.
            </p>
          </div>

          <div className="mt-16 w-full flex justify-center lg:justify-start">
            <PhonePreview />
          </div>
        </div>

        {/* RIGHT SIDE - Download Card */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col order-1 lg:order-2 z-20">
          <DownloadCard apkUrl={apkUrl} />
        </div>

      </div>
    </div>
  );
}
