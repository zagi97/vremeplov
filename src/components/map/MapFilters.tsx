/**
 * MapFilters Component
 * Filter controls for map view (decade and location search)
 */

import React from 'react';
import { Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { useLanguage, translateWithParams } from '../../contexts/LanguageContext';

interface MapFiltersProps {
  selectedDecade: string;
  onDecadeChange: (decade: string) => void;
  searchLocation: string;
  onSearchChange: (search: string) => void;
  availableDecades: number[];
  filteredCount: number;
  totalCount: number;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  selectedDecade,
  onDecadeChange,
  searchLocation,
  onSearchChange,
  availableDecades,
  filteredCount,
  totalCount
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-center md:items-center">
          {/* Filter label and icon */}
          <div className="flex items-center gap-2 min-w-fit">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{t('mapView.filters')}</span>
          </div>

          {/* Decade dropdown - custom styled */}
          <div className="relative w-full md:w-auto">
            <label htmlFor="decade-filter" className="sr-only">
              {t('mapView.filterByDecade')}
            </label>
            <select
              id="decade-filter"
              value={selectedDecade}
              onChange={(e) => onDecadeChange(e.target.value)}
              aria-label={t('mapView.filterByDecade')}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full md:min-w-[200px] cursor-pointer"
            >
              <option value="all">{t('mapView.allDecades')}</option>
              {availableDecades.map(decade => (
                <option key={decade} value={decade.toString()}>
                  {decade}{t('filter.decade')} ({decade}-{decade + 9})
                </option>
              ))}
            </select>
            {/* Custom arrow icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Search input */}
          <Input
            type="text"
            placeholder={t('mapView.searchByLocation')}
            value={searchLocation}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full md:flex-initial md:max-w-xs dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder:text-gray-400"
          />

          {/* Photo count */}
          <div className="text-sm text-gray-600 dark:text-gray-300 md:ml-auto whitespace-nowrap text-center md:text-left w-full md:w-auto">
            {translateWithParams(t, 'mapView.showing', { filtered: filteredCount, total: totalCount })}
          </div>
        </div>
      </div>
    </div>
  );
};
