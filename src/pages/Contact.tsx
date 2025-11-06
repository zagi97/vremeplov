import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, Heart, HelpCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <PageHeader title="Vremeplov.hr" />
      
      <div className="bg-white border-b border-gray-200 py-12 mt-16">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('contact.title')}
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

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
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-2 break-words overflow-wrap-anywhere">
  vremeplov.app@gmail.com
</p>
              <p className="text-gray-600">{t('contact.ourEmail')}</p>
            </div>
          </div>

          {/* ✅ NEW: Urgent Requests Box */}
          <div className="mb-12">
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-lg text-red-800 mb-2">
                    {t('contact.urgentRequests')}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {t('contact.urgentRequestsText')}
                  </p>
                </div>
              </div>
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

          {/* ✅ UPDATED: Response Time */}
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
      <Footer/>
    </div>
  );
};

export default Contact;