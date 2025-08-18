import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, Heart, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
                  <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('contact.title')}</h2>
            <p className="text-gray-300">{t('contact.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Main Contact */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4">{t('contact.getInTouch')}</h3>
            <p className="text-gray-700 text-lg mb-6">
              {t('contact.getInTouchText')}
            </p>
            <div className="bg-blue-50 p-6 rounded-lg inline-block">
              <p className="text-2xl font-bold text-blue-600 mb-2">vremeplov.app@gmail.com</p>
              <p className="text-gray-600">{t('contact.ourEmail')}</p>
            </div>
          </div>

          {/* Contact Reasons */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-8 text-center">{t('contact.whatCanWeHelp')}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="h-6 w-6 text-green-600" />
                  <h4 className="font-semibold text-lg">{t('contact.technicalSupport')}</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>{t('contact.techList1')}</li>
                  <li>{t('contact.techList2')}</li>
                  <li>{t('contact.techList3')}</li>
                  <li>{t('contact.techList4')}</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                  <h4 className="font-semibold text-lg">{t('contact.contentManagement')}</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>{t('contact.contentList1')}</li>
                  <li>{t('contact.contentList2')}</li>
                  <li>{t('contact.contentList3')}</li>
                  <li>{t('contact.contentList4')}</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-orange-600" />
                  <h4 className="font-semibold text-lg">{t('contact.partnership')}</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>{t('contact.partnershipList1')}</li>
                  <li>{t('contact.partnershipList2')}</li>
                  <li>{t('contact.partnershipList3')}</li>
                  <li>{t('contact.partnershipList4')}</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <h4 className="font-semibold text-lg">{t('contact.generalFeedback')}</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>{t('contact.feedbackList1')}</li>
                  <li>{t('contact.feedbackList2')}</li>
                  <li>{t('contact.feedbackList3')}</li>
                  <li>{t('contact.feedbackList4')}</li>
                </ul>
              </div>

            </div>
          </div>

          {/* Response Time */}
          <div className="bg-gray-50 p-6 rounded-lg mb-12">
            <h3 className="text-xl font-bold mb-4">{t('contact.responseTime')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('contact.responseTimeText')}
            </p>
          </div>

          {/* Alternative Ways */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">{t('contact.otherWays')}</h3>
            <p className="text-gray-700 mb-6">
              {t('contact.otherWaysText')}
            </p>
            <p className="text-gray-600 text-sm">
              {t('contact.newsletter')}
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
              <p className="mt-2">{t('footer.tagline')}</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/about" className="hover:text-white transition-colors">{t('footer.about')}</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
              <Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;