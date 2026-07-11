import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import Header from '@/components/Header';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SkinQuiz() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    skinType: '',
    concern: '',
    experience: '',
    budget: ''
  });
  const [contactInfo, setContactInfo] = useState({ name: '', contact: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      key: 'skinType',
      title: t('q1Title'),
      options: [
        { value: 'dry', label: t('q1Opt1') },
        { value: 'oily', label: t('q1Opt2') },
        { value: 'combination', label: t('q1Opt3') },
        { value: 'sensitive', label: t('q1Opt4') }
      ]
    },
    {
      key: 'concern',
      title: t('q2Title'),
      options: [
        { value: 'breakouts', label: t('q2Opt1') },
        { value: 'dryness', label: t('q2Opt2') },
        { value: 'dark-spots', label: t('q2Opt3') },
        { value: 'fine-lines', label: t('q2Opt4') }
      ]
    },
    {
      key: 'experience',
      title: t('q3Title'),
      options: [
        { value: 'beginner', label: t('q3Opt1') },
        { value: 'basics', label: t('q3Opt2') },
        { value: 'full-kit', label: t('q3Opt3') },
        { value: 'confident', label: t('q3Opt4') }
      ]
    },
    {
      key: 'budget',
      title: t('q4Title'),
      options: [
        { value: 'mid-range', label: t('q4Opt1') },
        { value: 'luxury', label: t('q4Opt2') },
        { value: 'mix', label: t('q4Opt3') }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSelectOption = (value) => {
    setAnswers({ ...answers, [currentQuestion.key]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.key]) {
      toast.error(language === 'en' ? 'Please select an option' : 'الرجاء اختيار خيار');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowContactForm(true);
    }
  };

  const handleBack = () => {
    if (showContactForm) {
      setShowContactForm(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/quiz`, {
        skin_type: answers.skinType,
        concern: answers.concern,
        experience: answers.experience,
        budget: answers.budget,
        name: contactInfo.name || undefined,
        contact: contactInfo.contact || undefined,
        language
      });
      navigate(`/quiz-result/${response.data.id}`);
    } catch (error) {
      toast.error(language === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-plum-soft">
                {t('question')} {currentStep + 1} {t('of')} {questions.length}
              </span>
              <span className="text-sm text-plum-soft">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-sand rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-rose-deep"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showContactForm ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-12">
                  <h1 className="text-3xl sm:text-4xl font-playfair text-plum mb-4">
                    {currentQuestion.title}
                  </h1>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelectOption(option.value)}
                      className={`quiz-card card cursor-pointer ${
                        answers[currentQuestion.key] === option.value ? 'selected' : ''
                      }`}
                      data-testid={`quiz-option-${option.value}`}
                    >
                      <p className="text-center text-plum font-medium">{option.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  {currentStep > 0 ? (
                    <button
                      onClick={handleBack}
                      className="btn-secondary flex items-center gap-2"
                      data-testid="quiz-back-btn"
                    >
                      {language === 'en' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      {language === 'en' ? 'Back' : 'رجوع'}
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.key]}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    data-testid="quiz-next-btn"
                  >
                    {currentStep === questions.length - 1 ? t('finish') : t('next')}
                    {language === 'en' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="card max-w-xl mx-auto"
              >
                <h2 className="text-2xl font-playfair text-plum mb-6 text-center">
                  {language === 'en' ? 'Almost Done!' : 'أوشكت على الانتهاء!'}
                </h2>
                <p className="text-plum-soft mb-6 text-center">
                  {language === 'en' 
                    ? 'Share your contact (optional) to save your results'
                    : 'شاركي معلومات التواصل (اختياري) لحفظ نتائجك'}
                </p>

                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder={t('fullName')}
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    className="input-field"
                    data-testid="quiz-name-input"
                  />
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Email or Phone' : 'البريد الإلكتروني أو الهاتف'}
                    value={contactInfo.contact}
                    onChange={(e) => setContactInfo({ ...contactInfo, contact: e.target.value })}
                    className="input-field"
                    data-testid="quiz-contact-input"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                    data-testid="quiz-contact-back-btn"
                  >
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={loading}
                    className="btn-primary flex-1"
                    data-testid="quiz-submit-btn"
                  >
                    {loading 
                      ? (language === 'en' ? 'Loading...' : 'جاري التحميل...') 
                      : (language === 'en' ? 'See Results' : 'عرض النتائج')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
