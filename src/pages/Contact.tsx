import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, Heart, HelpCircle } from 'lucide-react';

const Contact = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Contact Us</h2>
            <p className="text-gray-300">Get in touch with the Vremeplov.hr team</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Main Contact */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4">Get in Touch</h3>
            <p className="text-gray-700 text-lg mb-6">
              We'd love to hear from you! Whether you have questions, suggestions, or need help, 
              we're here to assist you.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg inline-block">
              <p className="text-2xl font-bold text-blue-600 mb-2">vremeplov.app@gmail.com</p>
              <p className="text-gray-600">Our dedicated email for all Vremeplov.hr inquiries</p>
            </div>
          </div>

          {/* Contact Reasons */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-8 text-center">What Can We Help You With?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="h-6 w-6 text-green-600" />
                  <h4 className="font-semibold text-lg">Technical Support</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>• Issues uploading photos</li>
                  <li>• Website functionality problems</li>
                  <li>• Account or login assistance</li>
                  <li>• Mobile compatibility issues</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                  <h4 className="font-semibold text-lg">Content Management</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>• Request photo removal</li>
                  <li>• Report inappropriate content</li>
                  <li>• Correct photo information</li>
                  <li>• Copyright concerns</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-orange-600" />
                  <h4 className="font-semibold text-lg">Partnership & Collaboration</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>• Museum partnerships</li>
                  <li>• Community collaborations</li>
                  <li>• Educational institution projects</li>
                  <li>• Media and press inquiries</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <h4 className="font-semibold text-lg">General Feedback</h4>
                </div>
                <ul className="text-gray-700 space-y-2">
                  <li>• Suggestions for improvement</li>
                  <li>• Feature requests</li>
                  <li>• Share your story</li>
                  <li>• General questions about the project</li>
                </ul>
              </div>

            </div>
          </div>

          {/* Response Time */}
          <div className="bg-gray-50 p-6 rounded-lg mb-12">
            <h3 className="text-xl font-bold mb-4">Response Time</h3>
            <p className="text-gray-700 leading-relaxed">
              We typically respond to all inquiries within 24-48 hours. For urgent issues, 
              please mark your email as "URGENT" in the subject line. We appreciate your patience 
              and look forward to helping you contribute to preserving Croatian heritage.
            </p>
          </div>

          {/* Alternative Ways */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Other Ways to Connect</h3>
            <p className="text-gray-700 mb-6">
              While email is our primary contact method, you can also reach out through our social media 
              channels or community forums when they become available.
            </p>
            <p className="text-gray-600 text-sm">
              Follow our development and updates by subscribing to our newsletter (coming soon)
            </p>
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

export default Contact;