import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Instagram } from 'lucide-react';

export default function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="bg-sand py-12 mt-20">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <h3 className="text-2xl font-playfair text-plum mb-4">
            {language === 'en' ? 'Serenne Beauty' : 'سيرين بيوتي'}
          </h3>
          <p className="text-plum-soft mb-6 max-w-md mx-auto">
            {language === 'en' 
              ? 'Your personal beauty companion in Dubai'
              : 'رفيقتك الجمالية الشخصية في دبي'}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <a 
              href="https://instagram.com/serennebeauty" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-rose-deep text-cream flex items-center justify-center hover:bg-plum transition-colors"
              data-testid="instagram-link"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://tiktok.com/@serennebeauty" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-rose-deep text-cream flex items-center justify-center hover:bg-plum transition-colors"
              data-testid="tiktok-link"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
          <p className="text-sm text-plum-soft">
            © 2025 Serenne Beauty. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
