import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Image, Video, Clock, Archive, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import FeatureCard from "@/components/FeaturedCard";
import SampleGallery from "@/components/SampleGallery";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-900 to-gray-800 min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=2070')] bg-cover bg-center opacity-40 z-[-1]"></div>
        <div className="container max-w-6xl mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in">
            Vremeplov<span className="text-gray-300">.hr</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto animate-fade-in">
            Discover and share the rich history of Croatian cities and villages through photos and videos from the past.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in">
            <SearchBar />
          </div>
          {/* Commented out buttons until their functionality is defined
          <div className="mt-12 flex justify-center space-x-4 animate-fade-in">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Start Exploring
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Share Your History
            </Button>
          </div>
          */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Reconnect with Your Heritage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="h-10 w-10 text-blue-600" />} 
              title="Discover Places" 
              description="Search for any city or village in Croatia and explore its visual history." 
            />
            <FeatureCard 
              icon={<Archive className="h-10 w-10 text-blue-600" />} 
              title="Preserve Memories" 
              description="Upload and share historical photos and videos from your family archives." 
            />
            <FeatureCard 
              icon={<Users className="h-10 w-10 text-blue-600" />} 
              title="Connect People" 
              description="Tag individuals, share stories, and reconnect with your community." 
            />
          </div>
        </div>
      </section>

      {/* Sample Gallery Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Glimpse into the Past</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Browse through our collection of historical photos from various Croatian locations.
          </p>
          <SampleGallery />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Journey Through Time</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Join our community and help preserve the visual history of Croatia for future generations.
          </p>
          {/* Commented out button until functionality is defined
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Sign Up Now
          </Button>
          */}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
              <p className="mt-2">Preserving Croatian heritage, one memory at a time.</p>
            </div>
            <div className="flex space-x-6">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
