import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Services() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-playfair text-plum mb-4">
              {t('ourPackages')}
            </h1>
            <p className="text-lg text-plum-soft max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Choose the perfect package for your beauty journey'
                : 'اختاري الباقة المثالية لرحلتك الجمالية'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="card relative"
                data-testid={`package-card-${pkg.id}`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 bg-gold text-cream px-4 py-1 rounded-full text-sm font-medium">
                    {t('mostLoved')}
                  </div>
                )}
                <h3 className="text-2xl font-playfair text-plum mb-3">
                  {language === 'en' ? pkg.name_en : pkg.name_ar}
                </h3>
                <p className="text-4xl font-bold text-rose-deep mb-4">
                  {t('aed')} {pkg.price_aed}
                </p>
                <p className="text-plum-soft mb-6 leading-relaxed min-h-[4rem]">
                  {language === 'en' ? pkg.description_en : pkg.description_ar}
                </p>
                <ul className="space-y-3 mb-8">
                  {(language === 'en' ? pkg.features_en : pkg.features_ar).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-plum-soft">
                      <Check className="w-5 h-5 text-rose-deep shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/booking', { state: { selectedPackage: pkg } })}
                  className="btn-primary w-full"
                  data-testid={`book-btn-${pkg.id}`}
                >
                  {t('bookNow')}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
