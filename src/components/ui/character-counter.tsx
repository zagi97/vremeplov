// src/components/ui/character-counter.tsx
import React from 'react';

interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  currentLength, 
  maxLength, 
  className = "" 
}) => {
  // Calculate percentage and determine color
  const percentage = (currentLength / maxLength) * 100;
  
  // Color logic:
  // - Green/gray: 0-79%
  // - Yellow/warning: 80-94% 
  // - Red: 95-100%
  const getColorClass = () => {
    if (percentage >= 95) return "text-red-600 font-medium";
    if (percentage >= 80) return "text-yellow-600 font-medium";
    return "text-gray-500";
  };

  return (
    <div className={`text-right text-xs mt-1 ${getColorClass()} ${className}`}>
      {currentLength}/{maxLength} characters
      {percentage >= 95 && (
        <span className="ml-1">⚠️</span>
      )}
    </div>
  );
};

export { CharacterCounter };