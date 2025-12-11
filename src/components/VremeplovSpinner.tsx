/**
 * VremeplovSpinner Component
 * Custom loading spinner with time-travel themed animation
 * Features a clock/camera lens design that rotates backwards (into the past)
 */

import React from 'react';

interface VremeplovSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24'
};

export const VremeplovSpinner: React.FC<VremeplovSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer ring (fixed) - represents the frame of time */}
      <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>

      {/* Inner spiral/lens (rotates BACKWARDS into the past) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full animate-[spin_3s_linear_infinite]"
        style={{ animationDirection: 'reverse' }}
      >
        {/* Camera lens petals / spiral segments */}
        <path
          fill="currentColor"
          d="M50 50 L50 10 A40 40 0 0 1 85 25 Z"
          className="opacity-80 text-orange-400"
        />
        <path
          fill="currentColor"
          d="M50 50 L85 25 A40 40 0 0 1 90 65 Z"
          className="opacity-90 text-teal-500"
        />
        <path
          fill="currentColor"
          d="M50 50 L90 65 A40 40 0 0 1 65 90 Z"
          className="opacity-100 text-teal-600"
        />
        <path
          fill="currentColor"
          d="M50 50 L65 90 A40 40 0 0 1 25 85 Z"
          className="opacity-90 text-teal-700"
        />
        <path
          fill="currentColor"
          d="M50 50 L25 85 A40 40 0 0 1 10 50 Z"
          className="opacity-80 text-orange-500"
        />
        <path
          fill="currentColor"
          d="M50 50 L10 50 A40 40 0 0 1 25 15 Z"
          className="opacity-70 text-orange-400"
        />
      </svg>

      {/* Center (Clock hands) - static or pulsing */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-1/3 w-1/3 rounded-full bg-white shadow-sm flex items-center justify-center z-10">
          {/* Small hand */}
          <div className="absolute h-3 w-1 bg-gray-800 rounded-full top-2 left-1/2 -ml-0.5 origin-bottom transform -rotate-45"></div>
          {/* Large hand */}
          <div className="absolute h-4 w-0.5 bg-gray-400 rounded-full top-1 left-1/2 -ml-px"></div>
          {/* Center dot */}
          <div className="h-1.5 w-1.5 bg-orange-500 rounded-full z-20"></div>
        </div>
      </div>
    </div>
  );
};

export default VremeplovSpinner;
