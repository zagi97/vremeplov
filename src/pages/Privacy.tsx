import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Database, Trash2, Mail } from 'lucide-react';
import { translateWithParams, useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const Privacy = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('privacy.title')}</h2>
            <p className="text-gray-300">{t('privacy.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Data Collection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">{t('privacy.dataCollection')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.dataCollectionText1')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('privacy.dataCollectionList1')}</li>
                <li>{t('privacy.dataCollectionList2')}</li>
                <li>{t('privacy.dataCollectionList3')}</li>
                <li>{t('privacy.dataCollectionList4')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.dataCollectionText2')}
              </p>
            </div>
          </div>

          {/* Data Protection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold">{t('privacy.dataProtection')}</h3>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.dataProtectionText1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.dataProtectionText2')}
              </p>
            </div>
          </div>

          {/* Content Removal */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">{t('privacy.contentRemoval')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.contentRemovalText1')}
              </p>
              <p className="text-gray-700 leading-relaxed font-medium">
                {t('privacy.contentRemovalText2')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('privacy.contentRemovalList1')}</li>
                <li>{t('privacy.contentRemovalList2')}</li>
                <li>{t('privacy.contentRemovalList3')}</li>
                <li>{t('privacy.contentRemovalList4')}</li>
              </ul>
            </div>
          </div>

          {/* Contact for Privacy */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="h-8 w-8 text-purple-500" />
              <h3 className="text-2xl font-bold">{t('privacy.privacyQuestions')}</h3>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.privacyQuestionsText')}
              </p>
              <p className="text-lg font-medium text-purple-700">
                vremeplov.app@gmail.com
              </p>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4">{t('privacy.policyUpdates')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('privacy.policyUpdatesText')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {translateWithParams(t, 'privacy.lastUpdated', { date: new Date().toLocaleDateString() })}
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

export default Privacy;