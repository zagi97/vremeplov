import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Database, Trash2, Mail } from 'lucide-react';

const Privacy = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h2>
            <p className="text-gray-300">How we protect and handle your data</p>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          
          {/* Data Collection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-blue-500" />
              <h3 className="text-2xl font-bold">Data Collection and Storage</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                When you upload photos to Vremeplov.hr, we collect and store the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Historical photographs you choose to share</li>
                <li>Photo metadata (year, location, description, author)</li>
                <li>Comments and tags you add to photos</li>
                <li>Basic usage analytics to improve the platform</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                All uploaded photos are stored securely in our database and are made publicly available 
                on the platform to fulfill our mission of preserving Croatian heritage. By uploading content, 
                you grant permission for it to be displayed on Vremeplov.hr.
              </p>
            </div>
          </div>

          {/* Data Protection */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold">Data Protection</h3>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                We take the security of your data seriously. All uploads are processed through secure 
                connections and stored using industry-standard security measures.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties. 
                Your data is used solely for the purpose of operating and improving Vremeplov.hr.
              </p>
            </div>
          </div>

          {/* Content Removal */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold">Content Removal</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                If you need to remove photos or other content you've uploaded, you can request deletion 
                by contacting us with a valid reason. We will review each request and remove content when appropriate.
              </p>
              <p className="text-gray-700 leading-relaxed font-medium">
                Valid reasons for content removal include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Copyright concerns or ownership disputes</li>
                <li>Privacy concerns regarding individuals in photos</li>
                <li>Inaccurate or misleading information</li>
                <li>Personal or family requests for removal</li>
              </ul>
            </div>
          </div>

          {/* Contact for Privacy */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="h-8 w-8 text-purple-500" />
              <h3 className="text-2xl font-bold">Privacy Questions</h3>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this privacy policy or concerns about your data, 
                please contact us at:
              </p>
              <p className="text-lg font-medium text-purple-700">
                vremeplov@vremeplov.hr
              </p>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4">Policy Updates</h3>
            <p className="text-gray-700 leading-relaxed">
              This privacy policy may be updated from time to time. Any changes will be posted on this page 
              with an updated revision date. Continued use of Vremeplov.hr after changes constitutes 
              acceptance of the updated policy.
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

export default Privacy;