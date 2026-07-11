import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [direction, setDirection] = useState('ltr');

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
  }, [direction, language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    const newDir = newLang === 'ar' ? 'rtl' : 'ltr';
    setLanguage(newLang);
    setDirection(newDir);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    home: 'Home',
    services: 'Services',
    about: 'About',
    contact: 'Contact',
    heroTitle: 'Find what truly suits you',
    heroSubtitle: 'Your personal beauty companion from skin quiz to guided shopping',
    takeSkinQuiz: 'Take the Skin Quiz',
    joinVIP: 'Join the VIP List',
    howItWorks: 'How It Works',
    step1Title: 'Discover Your Skin',
    step1Desc: 'Take our quick quiz to understand your skin type and concerns',
    step2Title: 'Meet Your Expert',
    step2Desc: 'Book a personalized consultation with our beauty specialist',
    step3Title: 'Shop Together',
    step3Desc: 'Get guided shopping and learn to use your perfect products',
    ourPackages: 'Our Packages',
    mostLoved: 'Most Loved',
    bookNow: 'Book Now',
    aed: 'AED',
    vipTitle: 'Join the VIP Waitlist',
    vipSubtitle: 'Be the first to know when we launch',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone / WhatsApp',
    submit: 'Submit',
    success: 'Success!',
    vipSuccess: "You've been added to our VIP list",
    quizTitle: 'Discover Your Perfect Routine',
    quizSubtitle: 'Answer 4 quick questions',
    question: 'Question',
    of: 'of',
    next: 'Next',
    finish: 'Finish',
    q1Title: 'How does your skin feel by midday?',
    q1Opt1: 'Dry & Tight',
    q1Opt2: 'Oily & Shiny',
    q1Opt3: 'Combination',
    q1Opt4: 'Sensitive & Red',
    q2Title: "What's your main skin concern?",
    q2Opt1: 'Breakouts',
    q2Opt2: 'Dryness',
    q2Opt3: 'Dark Spots',
    q2Opt4: 'Fine Lines',
    q3Title: 'Your makeup experience?',
    q3Opt1: 'Complete Beginner',
    q3Opt2: 'Some Basics',
    q3Opt3: 'Full Kit',
    q3Opt4: 'Very Confident',
    q4Title: 'Preferred budget range?',
    q4Opt1: 'Mid-range',
    q4Opt2: 'Luxury',
    q4Opt3: 'Mix of Both',
    yourResult: 'Your Personalized Result',
    skinType: 'Skin Type',
    mainConcern: 'Main Concern',
    budgetRange: 'Budget Range',
    starterRoutine: 'Your Starter Routine',
    bookSession: 'Book Your Session',
    bookingTitle: 'Book Your Session',
    selectPackage: 'Select Package',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    today: 'Today',
    confirmBooking: 'Confirm Booking',
    bookingSuccess: 'Booking Confirmed!',
    bookingSuccessMsg: "We'll contact you shortly via WhatsApp",
    aboutTitle: 'About Serenne Beauty',
    aboutText: 'We believe every woman deserves to feel confident in her own skin. Serenne Beauty was created to end the confusion of beauty shopping and empower you with personalized guidance.',
    adminLogin: 'Admin Login',
    password: 'Password',
    login: 'Login',
    dashboard: 'Dashboard',
    vipSignups: 'VIP Signups',
    quizResponses: 'Quiz Responses',
    bookings: 'Bookings',
    stats: 'Statistics',
    logout: 'Logout',
    export: 'Export CSV',
    status: 'Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    markAs: 'Mark as',
  },
  ar: {
    home: 'الرئيسية',
    services: 'الخدمات',
    about: 'من نحن',
    contact: 'اتصل بنا',
    heroTitle: 'اكتشفي ما يناسبك حقاً',
    heroSubtitle: 'رفيقتك الجمالية الشخصية من اختبار البشرة إلى التسوق الموجه',
    takeSkinQuiz: 'ابدئي الاختبار',
    joinVIP: 'انضمي لقائمة الانتظار',
    howItWorks: 'كيف يعمل',
    step1Title: 'اكتشفي بشرتك',
    step1Desc: 'أجيبي على الاختبار السريع لفهم نوع بشرتك ومخاوفك',
    step2Title: 'التقي بخبيرتك',
    step2Desc: 'احجزي استشارة شخصية مع متخصصة التجميل',
    step3Title: 'تسوقي معاً',
    step3Desc: 'احصلي على توجيه في التسوق وتعلمي استخدام منتجاتك المثالية',
    ourPackages: 'باقاتنا',
    mostLoved: 'الأكثر محبة',
    bookNow: 'احجزي الآن',
    aed: 'درهم',
    vipTitle: 'انضمي لقائمة الانتظار',
    vipSubtitle: 'كوني أول من يعرف عند الإطلاق',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف / واتساب',
    submit: 'إرسال',
    success: 'نجاح!',
    vipSuccess: 'تم إضافتك إلى قائمتنا',
    quizTitle: 'اكتشفي روتينك المثالي',
    quizSubtitle: 'أجيبي على 4 أسئلة سريعة',
    question: 'سؤال',
    of: 'من',
    next: 'التالي',
    finish: 'إنهاء',
    q1Title: 'كيف تشعر بشرتك بحلول منتصف النهار؟',
    q1Opt1: 'جافة ومشدودة',
    q1Opt2: 'دهنية ولامعة',
    q1Opt3: 'مختلطة',
    q1Opt4: 'حساسة ومحمرة',
    q2Title: 'ما هو قلقك الرئيسي للبشرة؟',
    q2Opt1: 'حب الشباب',
    q2Opt2: 'الجفاف',
    q2Opt3: 'البقع الداكنة',
    q2Opt4: 'الخطوط الدقيقة',
    q3Title: 'خبرتك في المكياج؟',
    q3Opt1: 'مبتدئة تماماً',
    q3Opt2: 'بعض الأساسيات',
    q3Opt3: 'أدوات كاملة',
    q3Opt4: 'واثقة جداً',
    q4Title: 'نطاق الميزانية المفضل؟',
    q4Opt1: 'متوسط السعر',
    q4Opt2: 'فاخر',
    q4Opt3: 'مزيج من الاثنين',
    yourResult: 'نتيجتك الشخصية',
    skinType: 'نوع البشرة',
    mainConcern: 'القلق الرئيسي',
    budgetRange: 'نطاق الميزانية',
    starterRoutine: 'روتينك البدائي',
    bookSession: 'احجزي جلستك',
    bookingTitle: 'احجزي جلستك',
    selectPackage: 'اختاري الباقة',
    selectDate: 'اختاري التاريخ',
    selectTime: 'اختاري الوقت',
    today: 'اليوم',
    confirmBooking: 'تأكيد الحجز',
    bookingSuccess: 'تم تأكيد الحجز!',
    bookingSuccessMsg: 'سنتواصل معك قريباً عبر واتساب',
    aboutTitle: 'عن سيرين بيوتي',
    aboutText: 'نؤمن أن كل امرأة تستحق أن تشعر بالثقة في بشرتها. تم إنشاء سيرين بيوتي لإنهاء الحيرة في التسوق الجمالي وتمكينك بالإرشاد الشخصي.',
    adminLogin: 'تسجيل دخول المسؤول',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    dashboard: 'لوحة التحكم',
    vipSignups: 'تسجيلات VIP',
    quizResponses: 'إجابات الاختبار',
    bookings: 'الحجوزات',
    stats: 'الإحصائيات',
    logout: 'تسجيل الخروج',
    export: 'تصدير CSV',
    status: 'الحالة',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    markAs: 'وضع علامة',
  },
};
