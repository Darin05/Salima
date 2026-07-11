import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuizResult() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [routine, setRoutine] = useState([]);

  useEffect(() => {
    fetchQuizResult();
  }, [id]);

  const fetchQuizResult = async () => {
    try {
      const response = await axios.get(`${API}/quiz/${id}`);
      setQuizData(response.data);
      generateRoutine(response.data);
    } catch (error) {
      console.error('Error fetching quiz result:', error);
    }
  };

  const generateRoutine = (data) => {
    const routines = {
      en: {
        dry: ['Gentle Cleanser', 'Hydrating Serum', 'Rich Moisturizer', 'SPF 50'],
        oily: ['Foaming Cleanser', 'Niacinamide Serum', 'Light Moisturizer', 'Oil-Free SPF'],
        combination: ['Balanced Cleanser', 'Hyaluronic Acid', 'Gel Moisturizer', 'Broad Spectrum SPF'],
        sensitive: ['Soothing Cleanser', 'Calming Serum', 'Barrier Cream', 'Mineral SPF']
      },
      ar: {
        dry: ['منظف لطيف', 'سيروم مرطب', 'مرطب غني', 'واقي شمسي 50'],
        oily: ['منظف رغوي', 'سيروم نياسيناميد', 'مرطب خفيف', 'واقي شمسي خالٍ من الزيوت'],
        combination: ['منظف متوازن', 'حمض الهيالورونيك', 'مرطب جل', 'واقي شمسي واسع الطيف'],
        sensitive: ['منظف مهدئ', 'سيروم مهدئ', 'كريم حاجز', 'واقي شمسي معدني']
      }
    };

    const skinType = data.skin_type;
    setRoutine(routines[language][skinType] || routines[language]['combination']);
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-rose-deep animate-spin mx-auto mb-4" />
            <p className="text-plum-soft">{language === 'en' ? 'Loading...' : 'جاري التحميل...'}</p>
          </div>
        </div>
      </div>
    );
  }

  const skinTypeLabels = {
    en: { dry: 'Dry', oily: 'Oily', combination: 'Combination', sensitive: 'Sensitive' },
    ar: { dry: 'جافة', oily: 'دهنية', combination: 'مختلطة', sensitive: 'حساسة' }
  };

  const concernLabels = {
    en: { breakouts: 'Breakouts', dryness: 'Dryness', 'dark-spots': 'Dark Spots', 'fine-lines': 'Fine Lines' },
    ar: { breakouts: 'حب الشباب', dryness: 'الجفاف', 'dark-spots': 'البقع الداكنة', 'fine-lines': 'الخطوط الدقيقة' }
  };

  const budgetLabels = {
    en: { 'mid-range': 'Mid-range', luxury: 'Luxury', mix: 'Mix of Both' },
    ar: { 'mid-range': 'متوسط السعر', luxury: 'فاخر', mix: 'مزيج من الاثنين' }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 rounded-full bg-blush mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-rose-deep" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-playfair text-plum mb-4">
              {t('yourResult')}
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-sm uppercase tracking-wider text-plum-soft mb-2">{t('skinType')}</h3>
              <p className="text-2xl font-playfair text-rose-deep">
                {skinTypeLabels[language][quizData.skin_type]}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-sm uppercase tracking-wider text-plum-soft mb-2">{t('mainConcern')}</h3>
              <p className="text-2xl font-playfair text-rose-deep">
                {concernLabels[language][quizData.concern]}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card text-center"
            >
              <h3 className="text-sm uppercase tracking-wider text-plum-soft mb-2">{t('budgetRange')}</h3>
              <p className="text-2xl font-playfair text-rose-deep">
                {budgetLabels[language][quizData.budget]}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card mb-12"
          >
            <h2 className="text-2xl font-playfair text-plum mb-6">{t('starterRoutine')}</h2>
            <div className="space-y-3">
              {routine.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center shrink-0">
                    <span className="text-rose-deep font-medium">{index + 1}</span>
                  </div>
                  <p className="text-plum-soft">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            <button
              onClick={() => navigate('/booking')}
              className="btn-primary"
              data-testid="result-book-btn"
            >
              {t('bookSession')}
            </button>
            <p className="text-sm text-plum-soft">
              {language === 'en' 
                ? 'Book a session to get personalized product recommendations' 
                : 'احجزي جلسة للحصول على توصيات منتجات شخصية'}
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
