import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Copyright, Gavel, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  children: React.ReactNode;
}

const TermsModal = ({ children }: TermsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]" aria-describedby="terms-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
        </DialogHeader>
        <div id="terms-description" className="sr-only">Terms of Service and user agreement for Vremeplov.hr</div>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-8">
            
            {/* Acceptance */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-blue-500" />
                <h3 className="text-xl font-bold">Acceptance of Terms</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Vremeplov.hr, you accept and agree to be bound by these terms and conditions. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </div>

            {/* Content Guidelines */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Copyright className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-bold">Content and Copyright</h3>
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
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Gavel className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-bold">User Responsibilities</h3>
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
            <div>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-xl font-bold">Prohibited Activities</h3>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
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
            <div>
              <h3 className="text-xl font-bold mb-4">Platform Availability</h3>
              <p className="text-gray-700 leading-relaxed">
                While we strive to maintain 24/7 availability, Vremeplov.hr may occasionally be 
                unavailable due to maintenance, updates, or technical issues. We are not liable 
                for any inconvenience caused by temporary unavailability.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h3 className="text-xl font-bold mb-4">Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                Vremeplov.hr is provided "as is" without warranties of any kind. We are not liable 
                for any damages arising from your use of the platform, including but not limited to 
                data loss, service interruptions, or inaccuracies in user-contributed content.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold mb-4">Questions About Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these terms of service, please contact us at 
                <span className="font-medium text-blue-600"> vremeplov.app@gmail.com</span>
              </p>
            </div>

            {/* Updates */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Terms Updates</h3>
              <p className="text-gray-700 leading-relaxed">
                These terms may be updated from time to time. Changes will be posted on this page. 
                Continued use of the platform after changes constitutes acceptance of the updated terms.
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

export default TermsModal;