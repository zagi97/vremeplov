import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "./ui/button";

interface YearPickerProps {
  selectedYear: string;
  onYearSelect: (year: string) => void;
  placeholder?: string;
  required?: boolean;
  t?: (key: string) => string;
}

const YearPicker: React.FC<YearPickerProps> = ({ 
  selectedYear, 
  onYearSelect, 
  placeholder = "Select year",
  required = false,
  t
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDecade, setCurrentDecade] = useState(2020);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const minYear = 1900;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set initial decade based on selected year or current year
  useEffect(() => {
    if (selectedYear) {
      const year = parseInt(selectedYear);
      setCurrentDecade(Math.floor(year / 20) * 20);
    } else {
      setCurrentDecade(Math.floor(currentYear / 20) * 20);
    }
  }, [selectedYear, currentYear]);

  // Generate years for current view (show 20 years at once)
  const generateYears = () => {
    const years = [];
    const startYear = currentDecade;
    const endYear = Math.min(startYear + 19, currentYear);
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const handleYearSelect = (year: number) => {
    onYearSelect(year.toString());
    setIsOpen(false);
  };

  const goToPreviousDecade = () => {
    const newDecade = currentDecade - 20;
    if (newDecade >= minYear) {
      setCurrentDecade(newDecade);
    }
  };

  const goToNextDecade = () => {
    const newDecade = currentDecade + 20;
    if (newDecade <= currentYear) {
      setCurrentDecade(newDecade);
    }
  };

  const getDecadeRange = () => {
    const endYear = Math.min(currentDecade + 19, currentYear);
    return `${currentDecade} - ${endYear}`;
  };

  const getPlaceholderText = () => {
    if (t) {
      return t('upload.selectYear');
    }
    return placeholder;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Year Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm cursor-pointer flex items-center justify-between hover:border-gray-400 transition-colors ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''
        } ${required && !selectedYear ? 'border-red-300' : ''}`}
      >
        <span className={selectedYear ? 'text-gray-900' : 'text-gray-500'}>
          {selectedYear || getPlaceholderText()}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Header with navigation */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goToPreviousDecade}
              disabled={currentDecade <= minYear}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium text-gray-700 text-sm">
              {getDecadeRange()}
            </span>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goToNextDecade}
              disabled={currentDecade + 20 > currentYear}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Years Grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-5 gap-1">
              {generateYears().map((year) => (
                <Button
                  key={year}
                  type="button"
                  variant={selectedYear === year.toString() ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleYearSelect(year)}
                  className={`h-8 text-xs ${
                    selectedYear === year.toString()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : year === currentYear
                      ? 'bg-gray-100 text-gray-900 font-medium hover:bg-gray-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Jump Decades */}
          <div className="border-t border-gray-200 p-2">
            <div className="text-xs text-gray-500 mb-2">Quick jump:</div>
            <div className="flex flex-wrap gap-1">
              {[2020, 2000, 1980, 1960, 1940, 1920].map((decade) => (
                <Button
                  key={decade}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDecade(decade)}
                  className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-100"
                >
                  {decade}s
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearPicker;