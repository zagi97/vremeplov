import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, ChevronDown, Upload, Copyright, MapPin, Users, Shield, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Footer from '@/components/Footer';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';

const FAQ = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSections = [
    {
      title: t('faq.uploadModeration'),
      icon: Upload,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      questions: [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
      ]
    },
    {
      title: t('faq.copyrightOwnership'),
      icon: Copyright,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      questions: [
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
      ]
    },
    {
      title: t('faq.locationAddress'),
      icon: MapPin,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      questions: [
        { q: t('faq.q6'), a: t('faq.a6') },
        { q: t('faq.q7'), a: t('faq.a7') },
      ]
    },
    {
      title: t('faq.accountTiers'),
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      questions: [
        { q: t('faq.q8'), a: t('faq.a8') },
        { q: t('faq.q9'), a: t('faq.a9') },
      ]
    },
    {
      title: t('faq.privacyData'),
      icon: Shield,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      questions: [
        { q: t('faq.q10'), a: t('faq.a10') },
        { q: t('faq.q11'), a: t('faq.a11') },
      ]
    },
    {
      title: t('faq.technical'),
      icon: Wrench,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      questions: [
        { q: t('faq.q12'), a: t('faq.a12') },
      ]
    },
  ];

  let questionCounter = 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <PageHeader title="Vremeplov.hr" />

      <div className="bg-white border-b border-gray-200 py-12 mt-16">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t("faq.title")}
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* FAQ Sections */}
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-10">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <section.icon className={`h-7 w-7 ${section.color}`} />
                <h3 className="text-2xl font-bold text-gray-800">{section.title}</h3>
              </div>

              {/* Questions in this section */}
              <div className="space-y-3">
                {section.questions.map((item, qIndex) => {
                  const currentIndex = questionCounter++;
                  const isOpen = openIndex === currentIndex;

                  return (
                    <div
                      key={currentIndex}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        isOpen ? 'border-gray-300 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      {/* Question Button */}
                      <button
                        onClick={() => toggleAccordion(currentIndex)}
                        className={`w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors ${
                          isOpen ? section.bgColor : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <HelpCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${section.color}`} />
                          <span className="font-semibold text-gray-800 pr-4">
                            {item.q}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Answer (collapsible) */}
                      {isOpen && (
                        <div className={`px-5 py-4 border-t ${section.bgColor}`}>
                          <p className="text-gray-700 leading-relaxed pl-8">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Still have questions box */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg text-center">
            <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {t('faq.stillHaveQuestions')}
            </h3>
            <p className="text-gray-700 mb-4">
              {t('faq.contactUs')}{' '}
              <a 
                href="mailto:vremeplov.app@gmail.com" 
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                vremeplov.app@gmail.com
              </a>{' '}
              {t('faq.andWeWillHelp')}
            </p>
            <Link to="/contact">
              <Button className="bg-blue-600 hover:bg-blue-700">
                {t('contact.title')}
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FAQ;