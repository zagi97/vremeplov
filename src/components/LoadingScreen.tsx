/**
 * LoadingScreen Component
 * Full-page loading screen with VremeplovSpinner
 * Used for major page loading states
 */

import React from 'react';
import { VremeplovSpinner } from './VremeplovSpinner';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  fullScreen = true
}) => {
  const { t } = useLanguage();

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Main Logo Animation */}
      <VremeplovSpinner size="xl" />

      {/* Text Below */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-bold text-gray-700 tracking-tight">
          VREMEPLOV
        </h2>
        <p className="text-sm text-gray-500 animate-pulse font-medium">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      {content}
    </div>
  );
};

export default LoadingScreen;
