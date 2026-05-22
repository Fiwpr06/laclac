import { Metadata } from 'next';
import PhonePreview from '../../src/components/download/PhonePreview';
import InstallGuide from '../../src/components/download/InstallGuide';
import DownloadButtons from '../../src/components/download/DownloadButtons';
import QRSection from '../../src/components/download/QRSection';
import { SmartphoneNfc } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tải ứng dụng Lắc Lắc | Trải nghiệm trên điện thoại',
  description: 'Tải file APK để trải nghiệm ứng dụng tìm món ăn ngẫu nhiên Lắc Lắc trên điện thoại thật của bạn.',
  openGraph: {
    title: 'Tải ứng dụng Lắc Lắc',
    description: 'Trải nghiệm ứng dụng tìm món ăn ngẫu nhiên trên điện thoại của bạn.',
    type: 'website',
  },
};

export default function DownloadPage() {
  const apkUrl = process.env['NEXT_PUBLIC_APK_URL'];

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col pt-8 pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand-primary/5 to-transparent -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
        
        {/* LEFT SIDE - Info & Guide */}
        <div className="flex-1 w-full flex flex-col justify-center order-2 lg:order-1 mt-8 lg:mt-0">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium text-sm mb-2">
              <SmartphoneNfc className="w-4 h-4" />
              <span>Cài đặt ứng dụng</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-brand-secondary tracking-tight">
              Tải ứng dụng <span className="text-brand-primary">Lắc Lắc</span>
            </h1>
            
            <p className="text-lg text-brand-muted max-w-xl mx-auto lg:mx-0">
              Trải nghiệm ứng dụng Lắc Lắc trên điện thoại thật. Quét mã QR hoặc tải trực tiếp file APK để cài đặt cho Android.
            </p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center lg:items-start gap-8">
            <PhonePreview />
            <div className="flex-1">
              <DownloadButtons apkUrl={apkUrl} />
              
              <div className="hidden lg:block mt-8 border-t border-brand-border pt-8">
                 <InstallGuide />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - QR & Phone */}
        <div className="w-full lg:w-[600px] xl:w-[640px] shrink-0 flex flex-col items-center gap-8 order-1 lg:order-2">
          <QRSection apkUrl={apkUrl} />
          
          {/* Mobile view guide (shows below QR on small screens) */}
          <div className="lg:hidden w-full max-w-md mx-auto mt-4 bg-white/50 p-6 rounded-3xl border border-white">
            <InstallGuide />
          </div>
        </div>

      </div>
    </div>
  );
}
