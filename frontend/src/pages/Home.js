import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [vipForm, setVipForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchTestimonials();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API}/testimonials`);
      setTestimonials(response.data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const handleVipSubmit = async (e) => {
    e.preventDefault();
    if (!vipForm.name) {
      toast.error(language === 'en' ? 'Please enter your name' : 'الرجاء إدخال اسمك');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/vip-signup`, {
        ...vipForm,
        language,
        source: 'website'
      });
      toast.success(t('vipSuccess'));
      setVipForm({ name: '', email: '', phone: '' });
    } catch (error) {
      toast.error(language === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-start"
            >
              <div className="glow-effect relative z-10">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair text-plum mb-6 leading-tight">
                  {t('heroTitle')}
                </h1>
                <p className="text-lg sm:text-xl text-plum-soft mb-8 leading-relaxed max-w-xl">
                  {t('heroSubtitle')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/quiz')}
                  className="btn-primary flex items-center justify-center gap-2"
                  data-testid="hero-quiz-btn"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('takeSkinQuiz')}
                </button>
                <button
                  onClick={() => document.getElementById('vip-form').scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary"
                  data-testid="hero-vip-btn"
                >
                  {t('joinVIP')}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.pexels.com/photos/33271832/pexels-photo-33271832.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Serenne Beauty"
                className="rounded-3xl shadow-[0_20px_60px_rgba(77,53,57,0.15)] w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-playfair text-plum mb-4">
              {t('howItWorks')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: t('step1Title'), desc: t('step1Desc') },
              { icon: Heart, title: t('step2Title'), desc: t('step2Desc') },
              { icon: ShoppingBag, title: t('step3Title'), desc: t('step3Desc') }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-blush mx-auto mb-6 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-rose-deep" />
                </div>
                <h3 className="text-xl font-playfair text-plum mb-3">{step.title}</h3>
                <p className="text-plum-soft leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Preview */}
      <section className="py-24 px-6 bg-sand">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-playfair text-plum mb-4">
              {t('ourPackages')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {packages.slice(0, 3).map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="card relative"
              >
                {pkg.is_popular && (
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 bg-gold text-cream px-4 py-1 rounded-full text-sm font-medium">
                    {t('mostLoved')}
                  </div>
                )}
                <h3 className="text-2xl font-playfair text-plum mb-3">
                  {language === 'en' ? pkg.name_en : pkg.name_ar}
                </h3>
                <p className="text-3xl font-bold text-rose-deep mb-4">
                  {t('aed')} {pkg.price_aed}
                </p>
                <p className="text-plum-soft mb-6 leading-relaxed">
                  {language === 'en' ? pkg.description_en : pkg.description_ar}
                </p>
                <ul className="space-y-2 mb-6">
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
                  data-testid={`book-package-${pkg.id}`}
                >
                  {t('bookNow')}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/services')}
              className="btn-secondary inline-flex items-center gap-2"
              data-testid="view-all-packages"
            >
              {language === 'en' ? 'View All Packages' : 'عرض جميع الباقات'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-playfair text-plum mb-4">
                {language === 'en' ? 'What Our Clients Say' : 'آراء عميلاتنا'}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="card"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Heart key={i} className="w-5 h-5 fill-rose-deep text-rose-deep" />
                    ))}
                  </div>
                  <p className="text-plum-soft mb-4 leading-relaxed italic">
                    "{language === 'en' ? testimonial.text_en : testimonial.text_ar}"
                  </p>
                  <p className="text-plum font-medium">
                    {language === 'en' ? testimonial.name_en : testimonial.name_ar}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VIP Form */}
      <section id="vip-form" className="py-24 px-6 bg-blush">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-playfair text-plum mb-3">
              {t('vipTitle')}
            </h2>
            <p className="text-plum-soft mb-8">{t('vipSubtitle')}</p>

            <form onSubmit={handleVipSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t('fullName')}
                value={vipForm.name}
                onChange={(e) => setVipForm({ ...vipForm, name: e.target.value })}
                className="input-field"
                data-testid="vip-name-input"
                required
              />
              <input
                type="email"
                placeholder={t('email')}
                value={vipForm.email}
                onChange={(e) => setVipForm({ ...vipForm, email: e.target.value })}
                className="input-field"
                data-testid="vip-email-input"
              />
              <input
                type="tel"
                placeholder={t('phone')}
                value={vipForm.phone}
                onChange={(e) => setVipForm({ ...vipForm, phone: e.target.value })}
                className="input-field"
                data-testid="vip-phone-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
                data-testid="vip-submit-btn"
              >
                {loading ? (language === 'en' ? 'Submitting...' : 'جاري الإرسال...') : t('submit')}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
