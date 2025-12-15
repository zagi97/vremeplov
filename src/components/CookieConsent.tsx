// src/components/CookieConsent.tsx
import { useState, useEffect } from 'react';
import { X, Cookie, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAnalytics } from 'firebase/analytics';
import app from '../lib/firebase';

const CONSENT_KEY = 'vremeplov-cookie-consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface ConsentPreferences {
  status: ConsentStatus;
  timestamp: number;
  analytics: boolean;
}

export function CookieConsent() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Provjeri postojeću dozvolu
    const savedConsent = localStorage.getItem(CONSENT_KEY);

    if (!savedConsent) {
      // Prikaži banner nakon 1s da ne ometa UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Primijeni postojeću dozvolu
      const consent: ConsentPreferences = JSON.parse(savedConsent);
      if (consent.status === 'accepted' && consent.analytics) {
        initializeAnalytics();
      }
    }
  }, []);

  const initializeAnalytics = () => {
    try {
      // ✅ Inicijaliziraj Analytics samo nakon pristanka
      const analytics = getAnalytics(app);
      console.log('✅ Analytics initialized with consent');
      return analytics;
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
    }
  };

  const handleAccept = () => {
    const consent: ConsentPreferences = {
      status: 'accepted',
      timestamp: Date.now(),
      analytics: true,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    initializeAnalytics();
    setShowBanner(false);
  };

  const handleReject = () => {
    const consent: ConsentPreferences = {
      status: 'rejected',
      timestamp: Date.now(),
      analytics: false,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay za detalje */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                {t('cookies.details.title')}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nužni kolačići */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  {t('cookies.details.essential.title')}
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    {t('cookies.details.essential.required')}
                  </span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('cookies.details.essential.description')}
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 ml-4">
                  <li>• <strong>vremeplov-auth</strong> - {t('cookies.details.essential.auth')}</li>
                  <li>• <strong>vremeplov-theme</strong> - {t('cookies.details.essential.theme')}</li>
                  <li>• <strong>vremeplov-language</strong> - {t('cookies.details.essential.language')}</li>
                  <li>• <strong>vremeplov-cookie-consent</strong> - {t('cookies.details.essential.consent')}</li>
                </ul>
              </div>

              {/* Analytics kolačići */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  {t('cookies.details.analytics.title')}
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {t('cookies.details.analytics.optional')}
                  </span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('cookies.details.analytics.description')}
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 ml-4">
                  <li>• <strong>_ga</strong> - Google Analytics ID</li>
                  <li>• <strong>_ga_*</strong> - Google Analytics session</li>
                </ul>
              </div>

              {/* GDPR info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">{t('cookies.details.gdpr.title')}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('cookies.details.gdpr.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[99] bg-white dark:bg-gray-800 border-t-2 border-blue-600 shadow-2xl">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Ikona i tekst */}
            <div className="flex-1 flex items-start gap-3">
              <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">{t('cookies.banner.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('cookies.banner.description')}
                </p>
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline mt-1"
                >
                  {t('cookies.banner.learnMore')}
                </button>
              </div>
            </div>

            {/* Gumbi */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('cookies.banner.reject')}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {t('cookies.banner.accept')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Export helper za provjeru pristanka
export function hasAnalyticsConsent(): boolean {
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  if (!savedConsent) return false;

  const consent: ConsentPreferences = JSON.parse(savedConsent);
  return consent.status === 'accepted' && consent.analytics;
}

// Export helper za resetiranje pristanka (za Privacy postavke)
export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
  window.location.reload();
}
