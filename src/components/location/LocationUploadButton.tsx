import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, LogIn } from 'lucide-react';

interface UploadLimitInfo {
  canUpload: boolean;
  uploadsToday: number;
  remainingToday: number;
  userTier: string;
  dailyLimit: number;
  nextTierInfo?: string;
}

interface LocationUploadButtonProps {
  user: { uid: string } | null;
  activeTab: string;
  uploadLimitInfo: UploadLimitInfo | null;
  onAddPhoto: () => void;
  onAddStory: () => void;
  onSignIn: () => void;
  t: (key: string) => string;
}

const LocationUploadButton: React.FC<LocationUploadButtonProps> = ({
  user,
  activeTab,
  uploadLimitInfo,
  onAddPhoto,
  onAddStory,
  onSignIn,
  t,
}) => {
  const [showClickTooltip, setShowClickTooltip] = useState(false);

  // Close click tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showClickTooltip) {
        setShowClickTooltip(false);
      }
    };

    if (showClickTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showClickTooltip]);

  if (!user) {
    return (
      <Button
        onClick={onSignIn}
        className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
      >
        <LogIn className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {activeTab === 'stories' ? t('stories.signInToAdd') : t('location.signInToAdd')}
        </span>
      </Button>
    );
  }

  return (
    <div className="w-full sm:w-auto">
      {/* Button with Tooltip */}
      <div className="relative group">
        <Button
          onClick={() => {
            if (activeTab === 'stories') {
              onAddStory();
            } else if (uploadLimitInfo?.canUpload) {
              onAddPhoto();
            } else {
              setShowClickTooltip(!showClickTooltip);
            }
          }}
          disabled={activeTab === 'photos' && uploadLimitInfo ? !uploadLimitInfo.canUpload : false}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 ${
            activeTab === 'stories' || uploadLimitInfo?.canUpload
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {activeTab === 'stories' ? t('stories.addStory') : t('location.addMemory')}
          </span>
        </Button>

        {/* DESKTOP HOVER TOOLTIP */}
        {uploadLimitInfo && !uploadLimitInfo.canUpload && (
          <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-30">
            <div className="text-center">
              <div className="font-semibold mb-1">{t('upload.limitReached')}</div>
              <div className="text-gray-300 leading-tight">
                Učitano: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </div>
              {uploadLimitInfo.userTier === 'NEW_USER' && (
                <div className="text-blue-300 mt-2 text-[9px] leading-tight">
                  💡 Verificiraj se za više
                </div>
              )}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}

        {/* TABLET CLICK TOOLTIP */}
        {uploadLimitInfo && !uploadLimitInfo.canUpload && showClickTooltip && (
          <div className="hidden sm:block lg:hidden absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg w-64 z-30 shadow-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowClickTooltip(false);
              }}
              className="absolute top-1 right-1 text-gray-400 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
            <div className="text-center pt-3">
              <div className="font-semibold mb-1 text-sm">{t('upload.limitReached')}</div>
              <div className="text-gray-300 text-xs leading-tight">
                Učitano danas: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </div>
              {uploadLimitInfo.userTier === 'NEW_USER' && (
                <div className="text-blue-300 mt-2 text-xs leading-tight">
                  💡 Verificiraj se za više uploadova
                </div>
              )}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]">
              <div className="border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE PERSISTENT CARD */}
      {uploadLimitInfo && !uploadLimitInfo.canUpload && (
        <div className="sm:hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">{t('upload.limitReached')}</h3>
              <p className="mt-1 text-xs text-red-700">
                {t('upload.uploadedToday')}: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </p>
              {uploadLimitInfo.nextTierInfo && (
                <p className="mt-2 text-xs text-blue-700 flex items-start gap-1">
                  <span className="flex-shrink-0">💡</span>
                  <span>{uploadLimitInfo.nextTierInfo}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationUploadButton;
