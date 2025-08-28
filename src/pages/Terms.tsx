import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, Copyright, Gavel } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const Terms = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('terms.title')}</h2>
            <p className="text-gray-300">{t('terms.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Acceptance */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">{t('terms.acceptance')}</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {t('terms.acceptanceText')}
            </p>
          </div>

          {/* Content Guidelines */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Copyright className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold">{t('terms.contentCopyright')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('terms.contentText1')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('terms.contentList1')}</li>
                <li>{t('terms.contentList2')}</li>
                <li>{t('terms.contentList3')}</li>
                <li>{t('terms.contentList4')}</li>
              </ul>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.contentText2')}
                </p>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Gavel className="h-8 w-8 text-purple-500" />
              <h3 className="text-2xl font-bold">{t('terms.userResponsibilities')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{t('terms.userText1')}</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('terms.userList1')}</li>
                <li>{t('terms.userList2')}</li>
                <li>{t('terms.userList3')}</li>
                <li>{t('terms.userList4')}</li>
                <li>{t('terms.userList5')}</li>
              </ul>
            </div>
          </div>

          {/* Prohibited Activities */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">{t('terms.prohibited')}</h3>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.prohibitedText')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('terms.prohibitedList1')}</li>
                <li>{t('terms.prohibitedList2')}</li>
                <li>{t('terms.prohibitedList3')}</li>
                <li>{t('terms.prohibitedList4')}</li>
                <li>{t('terms.prohibitedList5')}</li>
              </ul>
            </div>
          </div>

          {/* Platform Availability */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">{t('terms.availability')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('terms.availabilityText')}
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">{t('terms.liability')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('terms.liabilityText')}
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">{t('terms.questionsAbout')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('terms.questionsText')}
              <span className="font-medium text-blue-600"> vremeplov.app@gmail.com</span>
            </p>
          </div>

          {/* Updates */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4">{t('terms.termsUpdates')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('terms.termsUpdatesText')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

     {/* Footer */}
<footer className="py-10 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
  <div className="max-w-6xl mx-auto px-4">
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

export default Terms;