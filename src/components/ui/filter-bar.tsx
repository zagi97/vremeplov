import React from 'react';
import { Input } from './input';
import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions,
  sortValue,
  onSortChange,
  sortOptions
}: FilterBarProps) {
  return (
    <div className="flex gap-4 items-center flex-wrap">
      {/* Search Input */}
      <div className="flex-1 min-w-[300px] relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Filter Dropdown */}
      {filterOptions && onFilterChange && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.icon && `${option.icon} `}{option.label}
            </option>
          ))}
        </select>
      )}
      
      {/* Sort Dropdown */}
      {sortOptions && onSortChange && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}