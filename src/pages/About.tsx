import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Archive, Users, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Footer from '../components/Footer';

const About = () => {
   const { t } = useLanguage();
   
return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('about.title')}</h2>
            <p className="text-gray-300">{t('about.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Mission Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">{t('about.ourMission')}</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg mb-6">
              {t('about.missionText1')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('about.missionText2')}
            </p>
          </div>

          {/* How It Helps Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">{t('about.howWeHelp')}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <Archive className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">{t('about.digitalPreservation')}</h4>
                <p className="text-gray-600">
                  {t('about.digitalPreservationDesc')}
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">{t('about.localHistory')}</h4>
                <p className="text-gray-600">
                  {t('about.localHistoryDesc')}
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">{t('about.communityConnection')}</h4>
                <p className="text-gray-600">
                  {t('about.communityConnectionDesc')}
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">{t('about.culturalHeritage')}</h4>
                <p className="text-gray-600">
                  {t('about.culturalHeritageDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Developer Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">{t('about.aboutDeveloper')}</h3>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('about.developerText1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('about.developerText2')}
              </p>
            </div>
          </div>

          {/* Get Involved Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">{t('about.getInvolved')}</h3>
            <p className="text-gray-700 mb-6">
              {t('about.getInvolvedText')}
            </p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
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