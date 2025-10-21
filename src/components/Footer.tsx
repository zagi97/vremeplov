import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-8 sm:py-12 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="mb-4 sm:mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
              Vremeplov.hr
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-md">
              {t('footer.tagline')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link 
              to="/about" 
              className="hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {t('footer.about')}
            </Link>
            <Link 
              to="/faq" 
              className="hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              FAQ
            </Link>
            <Link 
              to="/privacy" 
              className="hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {t('footer.privacy')}
            </Link>
            <Link 
              to="/terms" 
              className="hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {t('footer.terms')}
            </Link>
            <Link 
              to="/contact" 
              className="hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {t('footer.contact')}
            </Link>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700 text-center">
          <p className="text-xs sm:text-sm">
            {new Date().getFullYear()} Vremeplov.hr. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;