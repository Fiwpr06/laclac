import { Metadata } from 'next';
import PhonePreview from '../../src/components/download/PhonePreview';
import ExpoGuide from '../../src/components/download/ExpoGuide';
import DownloadButtons from '../../src/components/download/DownloadButtons';
import QRSection from '../../src/components/download/QRSection';
import { SmartphoneNfc } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tải ứng dụng Lắc Lắc | Trải nghiệm trên điện thoại',
  description: 'Quét mã QR bằng Expo Go để trải nghiệm ứng dụng Lắc Lắc trên điện thoại thật của bạn.',
  openGraph: {
    title: 'Tải ứng dụng Lắc Lắc',
    description: 'Trải nghiệm ứng dụng tìm món ăn ngẫu nhiên trên điện thoại của bạn.',
    type: 'website',
  },
};

export default function DownloadPage() {
  const expoUrl = process.env.NEXT_PUBLIC_EXPO_URL;

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col pt-8 pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand-primary/5 to-transparent -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
        
        {/* LEFT SIDE - Info & Guide */}
        <div className="flex-1 w-full flex flex-col justify-center order-2 lg:order-1 mt-8 lg:mt-0">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium text-sm mb-2">
              <SmartphoneNfc className="w-4 h-4" />
              <span>Mobile Experience</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-brand-secondary tracking-tight">
              Mở ứng dụng bằng <span className="text-brand-primary">Expo Go</span>
            </h1>
            
            <p className="text-lg text-brand-muted max-w-xl mx-auto lg:mx-0">
              Quét QR bằng Expo Go để trải nghiệm ứng dụng Lắc Lắc trên điện thoại thật. Hiện tại hỗ trợ cho thiết bị Android.
            </p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center lg:items-start gap-8">
            <PhonePreview />
            <div className="flex-1">
              <DownloadButtons />
              
              <div className="hidden lg:block mt-8 border-t border-brand-border pt-8">
                 <ExpoGuide />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - QR & Phone */}
        <div className="w-full lg:w-[480px] shrink-0 flex flex-col items-center gap-8 order-1 lg:order-2">
          <QRSection expoUrl={expoUrl} />
          
          {/* Mobile view guide (shows below QR on small screens) */}
          <div className="lg:hidden w-full max-w-md mx-auto mt-4 bg-white/50 p-6 rounded-3xl border border-white">
            <ExpoGuide />
          </div>
        </div>

      </div>
    </div>
  );
}
