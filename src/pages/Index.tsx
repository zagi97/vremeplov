import { lazy, Suspense } from 'react';
import { MapPin, Archive, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";

// Static imports
import SearchBar from "@/components/SearchBar";
import { useLanguage } from "../contexts/LanguageContext";

// Lazy loads
const FeatureCard = lazy(() => import("@/components/FeaturedCard"));
const SampleGallery = lazy(() => import("@/components/SampleGallery"));
const LatestStories = lazy(() => import("@/components/LatestStories"));
const Footer = lazy(() => import("@/components/Footer"));

const ComponentLoader = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
);

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 overflow-x-hidden">
      {/* SEO meta tags */}
      <SEO url="/" />

      {/* ✅ Koristi PageHeader - automatski je fixed */}
      <PageHeader title="Vremeplov.hr" />

      {/* Hero Section - NEMA VIŠE CUSTOM NAV */}
      <section className="relative bg-gradient-to-b from-gray-900 to-gray-800 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 z-[-1]"></div>
        <div 
          className="absolute inset-0 opacity-10 z-[-1]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Content centiran - NEMA padding-top jer je nav uklonjen odavde */}
        <div className="w-full max-w-full sm:max-w-6xl mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in">
            Vremeplov<span className="text-gray-300">.hr</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto">
            {t('home.description')}
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Sample Gallery Section - "Pogled u prošlost" */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {t('home.glimpseTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto mb-16">
            {t('home.glimpseDesc')}
          </p>
          <Suspense fallback={<ComponentLoader />}>
            <SampleGallery />
          </Suspense>
        </div>
      </section>

      {/* Latest Stories Section - "Priče iz prošlosti" */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {t('home.latestStoriesTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto mb-12">
            {t('home.latestStoriesDesc')}
          </p>
          <Suspense fallback={<ComponentLoader />}>
            <LatestStories />
          </Suspense>
        </div>
      </section>

      {/* Features Section - "Povežite se s vlastitom baštinom" */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            {t('home.reconnectTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Suspense fallback={<ComponentLoader />}>
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
            </Suspense>
          </div>
        </div>
      </section>

      {/* Memory Map Preview Section - "Istražite Hrvatsku kroz vrijeme" */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            {t('home.exploreCroatiaTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
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

      {/* Footer */}
      <Suspense fallback={<div className="h-64 bg-gray-100"></div>}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;