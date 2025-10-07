import { MapPin, Archive, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import FeatureCard from "@/components/FeaturedCard";
import SampleGallery from "@/components/SampleGallery";
import UserProfile from "@/components/UserProfile";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import Footer from "@/components/Footer";

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-sm sm:text-xl md:text-2xl font-bold text-white truncate flex-shrink min-w-0">
              Vremeplov.hr
            </Link>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 ml-1">
              <Link 
                to="/map" 
                className="flex items-center text-white hover:text-blue-300 transition-colors text-xs sm:text-sm font-medium p-1"
              >
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline ml-1">{t('nav.memoryMap')}</span>
              </Link>
              <LanguageSelector />
              <UserProfile className="text-white" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-900 to-gray-800 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=2070')] bg-cover bg-center opacity-40 z-[-1]"></div>
        <div className="w-full max-w-full sm:max-w-6xl mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in">
            Vremeplov<span className="text-gray-300">.hr</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto animate-fade-in">
            {t('home.description')}
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t('home.reconnectTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="h-10 w-10 text-blue-600" />} 
              title={t('home.discoverTitle')} 
              description={t('home.discoverDesc')} 
            />
            <FeatureCard 
              icon={<Archive className="h-10 w-10 text-blue-600" />} 
              title={t('home.preserveTitle')} 
              description={t('home.preserveDesc')} 
            />
            <FeatureCard 
              icon={<Users className="h-10 w-10 text-blue-600" />} 
              title={t('home.connectTitle')} 
              description={t('home.connectDesc')} 
            />
          </div>
        </div>
      </section>

      {/* Memory Map Preview Section */}
      <section className="py-20 px-4 bg-white border-t border-gray-200">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('home.exploreCroatiaTitle')}
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
            {t('home.exploreCroatiaDesc')}
          </p>
          <Link 
            to="/map"
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
          >
            <MapPin className="h-6 w-6" />
            {t('home.exploreMemoryMap')}
          </Link>
        </div>
      </section>

      {/* Sample Gallery Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            {t('home.glimpseTitle')}
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
            {t('home.glimpseDesc')}
          </p>
          <SampleGallery />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('home.startJourneyTitle')}
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            {t('home.startJourneyDesc')}
          </p>
        </div>
      </section>

     {/* Footer */}
      <Footer/>
    </div>
  );
};

export default Index;