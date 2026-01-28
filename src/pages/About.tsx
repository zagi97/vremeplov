import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Archive, Users, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Footer from '../components/Footer';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';

const About = () => {
   const { t } = useLanguage();

return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <SEO title={t('about.title')} description={t('about.subtitle')} url="/about" />
      {/* Header */}
      <PageHeader title="Vremeplov.hr" />

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12 pt-28">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('about.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          {/* Mission Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('about.ourMission')}</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">
              {t('about.missionText1')}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.missionText2')}
            </p>
          </div>

          {/* How It Helps Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('about.howWeHelp')}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <Archive className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('about.digitalPreservation')}</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('about.digitalPreservationDesc')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('about.localHistory')}</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('about.localHistoryDesc')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('about.communityConnection')}</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('about.communityConnectionDesc')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('about.culturalHeritage')}</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('about.culturalHeritageDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Developer Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('about.aboutDeveloper')}</h3>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.developerText1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('about.developerText2')}
              </p>
            </div>
          </div>

          {/* Get Involved Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('about.getInvolved')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('about.getInvolvedText')}
            </p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                {t('about.startContributing')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default About;