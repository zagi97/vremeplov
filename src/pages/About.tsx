import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Archive, Users, MapPin } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">About Vremeplov</h2>
            <p className="text-gray-300">Preserving Croatian heritage, one memory at a time</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Mission Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">Our Mission</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg mb-6">
              Vremeplov.hr is a digital platform dedicated to preserving and sharing the rich visual history 
              of Croatian cities and villages. We believe that every photograph tells a story, and every story 
              deserves to be preserved for future generations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our mission is to create a comprehensive archive of historical photographs from across Croatia, 
              making these precious memories accessible to everyone while fostering a deeper connection to our heritage.
            </p>
          </div>

          {/* How It Helps Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">How We Help Communities</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <Archive className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">Digital Preservation</h4>
                <p className="text-gray-600">
                  We provide a secure, digital home for historical photographs that might otherwise be lost to time.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">Local History Documentation</h4>
                <p className="text-gray-600">
                  Each location gets its own dedicated space, creating comprehensive visual histories of Croatian places.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">Community Connection</h4>
                <p className="text-gray-600">
                  People can tag relatives, share stories, and connect with others who share their heritage.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600 mb-3" />
                <h4 className="font-semibold mb-2">Cultural Heritage</h4>
                <p className="text-gray-600">
                  We help communities maintain their cultural identity by preserving visual memories.
                </p>
              </div>
            </div>
          </div>

          {/* Developer Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">About the Developer</h3>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                Vremeplov.hr was created by <strong>Kruno Žagar</strong>, a passionate developer committed to 
                preserving Croatian heritage through technology. Understanding the importance of our cultural 
                history and the risk of losing precious memories, Kruno developed this platform to ensure that 
                future generations can explore and connect with their roots.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This project represents a personal commitment to giving back to the community by providing 
                a valuable service that helps preserve our shared cultural heritage.
              </p>
            </div>
          </div>

          {/* Get Involved Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">Get Involved</h3>
            <p className="text-gray-700 mb-6">
              Help us build the most comprehensive archive of Croatian historical photographs. 
              Your contributions make a difference in preserving our heritage.
            </p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start Contributing
              </Button>
            </Link>
          </div>
        </div>
      </div>

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

export default About;