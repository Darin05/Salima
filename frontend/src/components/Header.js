import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="glass-nav fixed top-0 start-0 end-0 z-50 border-b border-dusty-rose/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <Sparkles className="w-6 h-6 text-rose-deep" />
            <span className="text-2xl font-playfair font-semibold text-plum">
              {language === 'en' ? 'Serenne Beauty' : 'سيرين بيوتي'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-plum-soft hover:text-rose-deep transition-colors" data-testid="nav-home">
              {t('home')}
            </Link>
            <Link to="/services" className="text-plum-soft hover:text-rose-deep transition-colors" data-testid="nav-services">
              {t('services')}
            </Link>
            <Link to="/about" className="text-plum-soft hover:text-rose-deep transition-colors" data-testid="nav-about">
              {t('about')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-full border border-dusty-rose text-plum-soft hover:bg-blush transition-colors text-sm"
              data-testid="language-toggle"
            >
              {language === 'en' ? 'عربي' : 'English'}
            </button>
            <Link to="/quiz" className="hidden sm:block">
              <button className="btn-primary text-sm px-6" data-testid="header-quiz-btn">
                {t('takeSkinQuiz')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
