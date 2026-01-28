import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Database, Trash2, Mail, Scale, Cloud, Clock, Cookie } from 'lucide-react';
import { translateWithParams, useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { resetConsent } from '@/components/CookieConsent';
import SEO from '@/components/SEO';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <SEO title={t('privacy.title')} description={t('privacy.subtitle')} url="/privacy" />
      {/* Header */}
                  <PageHeader title="Vremeplov.hr" />
                  
                  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12 pt-28">
                    <div className="container max-w-5xl mx-auto px-4 text-center">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {t('privacy.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                        {t('privacy.subtitle')}
                      </p>
                    </div>
                  </div>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          
          {/* Data Collection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.dataCollection')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.dataCollectionText1')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.dataCollectionList1')}</li>
                <li>{t('privacy.dataCollectionList2')}</li>
                <li>{t('privacy.dataCollectionList3')}</li>
                <li>{t('privacy.dataCollectionList4')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.dataCollectionText2')}
              </p>
            </div>
          </div>

          {/* ✅ NEW: GDPR Rights Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="h-8 w-8 text-indigo-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.gdprRights')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t('privacy.gdprRightsText')}</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>✓</strong> {t('privacy.rightAccess')}</li>
                <li><strong>✓</strong> {t('privacy.rightDelete')}</li>
                <li><strong>✓</strong> {t('privacy.rightExport')}</li>
                <li><strong>✓</strong> {t('privacy.rightCorrect')}</li>
              </ul>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('privacy.rightsContact')} <span className="font-medium text-indigo-700 dark:text-indigo-300">vremeplov.app@gmail.com</span>
                </p>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Third-Party Services Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Cloud className="h-8 w-8 text-cyan-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.thirdPartyServices')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t('privacy.thirdPartyText')}</p>
              <div className="bg-cyan-50 dark:bg-cyan-900/30 p-5 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-800/50 rounded">
                    <Database className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Google Firebase</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('privacy.firebaseDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-800/50 rounded">
                    <Shield className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Google Analytics</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('privacy.analyticsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-800/50 rounded">
                    <Shield className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Google Maps API</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('privacy.mapsDesc')}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                {t('privacy.thirdPartyNote')}
              </p>
            </div>
          </div>

          {/* ✅ NEW: Cookies Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Cookie className="h-8 w-8 text-purple-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.cookiesTitle')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t('privacy.cookiesText')}</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.cookiesAnalytics')}</li>
                <li>{t('privacy.cookiesAuth')}</li>
                <li>{t('privacy.cookiesPreferences')}</li>
              </ul>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('privacy.cookiesControl')}
                </p>
                <Button
                  onClick={resetConsent}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Cookie className="h-4 w-4" />
                  {t('privacy.manageCookies')}
                </Button>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Data Retention Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-8 w-8 text-orange-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.dataRetention')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t('privacy.dataRetentionText')}</p>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-5 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-orange-600">📸</div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{t('privacy.retentionApproved')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-orange-600">👤</div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{t('privacy.retentionAccount')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-orange-600">🗑️</div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{t('privacy.retentionUnapproved')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.dataProtection')}</h3>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.dataProtectionText1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.dataProtectionText2')}
              </p>
            </div>
          </div>

          {/* Content Removal */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.contentRemoval')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.contentRemovalText1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {t('privacy.contentRemovalText2')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.privacyQuestions')}</h3>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.privacyQuestionsText')}
              </p>
              <p className="text-lg font-medium text-purple-700 dark:text-purple-300">
                vremeplov.app@gmail.com
              </p>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('privacy.policyUpdates')}</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy.policyUpdatesText')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {translateWithParams(t, 'privacy.lastUpdated', { date: new Date().toLocaleDateString() })}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default Privacy;