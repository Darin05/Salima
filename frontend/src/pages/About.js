import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Users, Sparkles } from 'lucide-react';

export default function About() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-playfair text-plum mb-6">
              {t('aboutTitle')}
            </h1>
            <p className="text-lg text-plum-soft max-w-3xl mx-auto leading-relaxed">
              {t('aboutText')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1756748955272-aec5485b9ab9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxtYWtldXAlMjBhcnRpc3QlMjBhcHBsaWNhdGlvbiUyMGx1eHVyeXxlbnwwfHx8fDE3ODM2OTA0NTV8MA&ixlib=rb-4.1.0&q=85"
                alt="Beauty Expert"
                className="rounded-3xl shadow-[0_20px_60px_rgba(77,53,57,0.15)] w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-playfair text-plum">
                {language === 'en' ? 'Our Story' : 'قصتنا'}
              </h2>
              <p className="text-plum-soft leading-relaxed">
                {language === 'en'
                  ? "Serenne Beauty was born from a simple observation: too many women own makeup they don't use because they were never shown how. We bridge that gap with personalized consultations, guided shopping, and practical training."
                  : 'ولدت سيرين بيوتي من ملاحظة بسيطة: تمتلك الكثير من النساء مكياجًا لا يستخدمنه لأنه لم يتم تعليمهن كيفية استخدامه. نحن نسد هذه الفجوة من خلال الاستشارات الشخصية والتسوق الموجه والتدريب العملي.'}
              </p>
              <p className="text-plum-soft leading-relaxed">
                {language === 'en'
                  ? 'Based in Dubai, we serve women across the GCC who want to feel confident and empowered in their beauty choices.'
                  : 'نحن مقرنا في دبي، ونخدم النساء في جميع أنحاء دول الخليج اللاتي يردن أن يشعرن بالثقة والتمكين في خياراتهن الجمالية.'}
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { 
                icon: Heart, 
                title: language === 'en' ? 'Personalized' : 'شخصي',
                desc: language === 'en' ? 'Every recommendation is tailored to your unique skin and style' : 'كل توصية مصممة خصيصًا لبشرتك وأسلوبك الفريد'
              },
              { 
                icon: Users, 
                title: language === 'en' ? 'Expert-Led' : 'بقيادة الخبراء',
                desc: language === 'en' ? 'Work with certified beauty specialists who truly care' : 'اعملي مع متخصصات تجميل معتمدات يهتممن حقًا'
              },
              { 
                icon: Sparkles, 
                title: language === 'en' ? 'Results-Focused' : 'تركيز على النتائج',
                desc: language === 'en' ? 'Leave confident, knowing exactly what suits you' : 'اتركي واثقة، وأنت تعرفين بالضبط ما يناسبك'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-blush mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-rose-deep" />
                </div>
                <h3 className="text-xl font-playfair text-plum mb-3">{feature.title}</h3>
                <p className="text-plum-soft">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={() => navigate('/booking')}
              className="btn-primary"
              data-testid="about-book-btn"
            >
              {language === 'en' ? 'Book Your Session' : 'احجزي جلستك'}
            </button>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
