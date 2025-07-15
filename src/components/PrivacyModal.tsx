import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Database, Trash2, Mail } from 'lucide-react';

interface PrivacyModalProps {
  children: React.ReactNode;
}

const PrivacyModal = ({ children }: PrivacyModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]" aria-describedby="privacy-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
        </DialogHeader>
        <div id="privacy-description" className="sr-only">Privacy Policy and data protection information for Vremeplov.hr</div>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-8">
            
            {/* Data Collection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-blue-500" />
                <h3 className="text-xl font-bold">Data Collection and Storage</h3>
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
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-bold">Data Protection</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
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
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
                <h3 className="text-xl font-bold">Content Removal</h3>
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
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-bold">Privacy Questions</h3>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have questions about this privacy policy or concerns about your data, 
                  please contact us at:
                </p>
                <p className="text-lg font-medium text-purple-700">
                  vremeplov.app@gmail.com
                </p>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Policy Updates</h3>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyModal;