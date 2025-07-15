import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, Copyright, Gavel } from 'lucide-react';

const Terms = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h2>
            <p className="text-gray-300">Rules and guidelines for using Vremeplov.hr</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Acceptance */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">Acceptance of Terms</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Vremeplov.hr, you accept and agree to be bound by these terms and conditions. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </div>

          {/* Content Guidelines */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Copyright className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold">Content and Copyright</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                When uploading content to Vremeplov.hr, you must ensure that:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You own the rights to the photographs or have permission to share them</li>
                <li>The content is historically accurate to the best of your knowledge</li>
                <li>Photos are appropriate and respectful to all individuals depicted</li>
                <li>Content does not violate any third-party rights or applicable laws</li>
              </ul>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  By uploading content, you grant Vremeplov.hr a non-exclusive license to display, 
                  store, and share your contributions as part of our cultural heritage preservation mission.
                </p>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Gavel className="h-8 w-8 text-purple-500" />
              <h3 className="text-2xl font-bold">User Responsibilities</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">As a user of Vremeplov.hr, you agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate information when uploading photos and metadata</li>
                <li>Use the platform respectfully and not engage in harassment or inappropriate behavior</li>
                <li>Respect the privacy and dignity of individuals in historical photographs</li>
                <li>Report any content that violates these terms or appears inappropriate</li>
                <li>Not attempt to damage, disable, or impair the platform's functionality</li>
              </ul>
            </div>
          </div>

          {/* Prohibited Activities */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">Prohibited Activities</h3>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                The following activities are strictly prohibited on Vremeplov.hr:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Uploading copyrighted material without permission</li>
                <li>Sharing false or misleading historical information</li>
                <li>Uploading inappropriate, offensive, or harmful content</li>
                <li>Attempting to hack, spam, or otherwise misuse the platform</li>
                <li>Commercial use without explicit permission</li>
              </ul>
            </div>
          </div>

          {/* Platform Availability */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Platform Availability</h3>
            <p className="text-gray-700 leading-relaxed">
              While we strive to maintain 24/7 availability, Vremeplov.hr may occasionally be 
              unavailable due to maintenance, updates, or technical issues. We are not liable 
              for any inconvenience caused by temporary unavailability.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed">
              Vremeplov.hr is provided "as is" without warranties of any kind. We are not liable 
              for any damages arising from your use of the platform, including but not limited to 
              data loss, service interruptions, or inaccuracies in user-contributed content.
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Questions About Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these terms of service, please contact us at 
              <span className="font-medium text-blue-600"> vremeplov.app@gmail.com</span>
            </p>
          </div>

          {/* Updates */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4">Terms Updates</h3>
            <p className="text-gray-700 leading-relaxed">
              These terms may be updated from time to time. Changes will be posted on this page. 
              Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString()}
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

export default Terms;