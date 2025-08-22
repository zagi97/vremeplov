import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tag, X, Search } from 'lucide-react';

// Same tag categories as in PhotoUpload component
const TAG_CATEGORIES = {
  people: {
    icon: '👥',
    name: 'People & Society',
    tags: [
      'Family', 'Wedding', 'Children', 'Elderly', 'Portrait', 
      'Group Photo', 'Celebration', 'Community', 'Fashion', 'Traditional Dress'
    ]
  },
  places: {
    icon: '🏛️',
    name: 'Places & Buildings',
    tags: [
      'Church', 'School', 'Market', 'Town Square', 'Bridge', 
      'Old Building', 'Monument', 'Cemetery', 'Factory', 'Farm'
    ]
  },
  events: {
    icon: '🎉',
    name: 'Events & Occasions',
    tags: [
      'Festival', 'Religious Ceremony', 'Sports Event', 'Market Day', 
      'Parade', 'Concert', 'Dance', 'Fair', 'Meeting', 'Ceremony'
    ]
  },
  work: {
    icon: '⚒️',
    name: 'Work & Industry',
    tags: [
      'Agriculture', 'Crafts', 'Trade', 'Construction', 'Transport', 
      'Fishing', 'Farming', 'Workshop', 'Market Vendor', 'Blacksmith'
    ]
  },
  transport: {
    icon: '🚂',
    name: 'Transportation',
    tags: [
      'Train', 'Horse Cart', 'Bicycle', 'Old Car', 'Boat', 
      'Railway', 'Station', 'Road', 'Bridge', 'Public Transport'
    ]
  },
  nature: {
    icon: '🌳',
    name: 'Nature & Environment',
    tags: [
      'River', 'Forest', 'Field', 'Garden', 'Park', 
      'Landscape', 'Trees', 'Flowers', 'Animals', 'Weather'
    ]
  },
  culture: {
    icon: '🎭',
    name: 'Culture & Tradition',
    tags: [
      'Folk Dance', 'Traditional Music', 'Folklore', 'Costume', 'Art', 
      'Literature', 'Theater', 'Cultural Event', 'Heritage', 'Customs'
    ]
  },
  historical: {
    icon: '📜',
    name: 'Historical Events',
    tags: [
      'War', 'Peace', 'Political Event', 'Royal Visit', 'Memorial', 
      'Independence', 'Revolution', 'Reconstruction', 'Historic Moment', 'Archive'
    ]
  }
};

// Get all tags as flat array for quick access
const ALL_TAGS = Object.values(TAG_CATEGORIES).flatMap(category => category.tags);

interface TagsFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTagsInPhotos: string[]; // Tags that actually exist in photos
}

const TagsFilter: React.FC<TagsFilterProps> = ({ 
  selectedTags, 
  onTagsChange, 
  availableTagsInPhotos 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('people');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tags based on search query and availability
  const filteredTags = searchQuery 
    ? ALL_TAGS.filter(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
        availableTagsInPhotos.includes(tag)
      )
    : TAG_CATEGORIES[activeCategory as keyof typeof TAG_CATEGORIES]?.tags.filter(tag =>
        availableTagsInPhotos.includes(tag)
      ) || [];

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  // Get popular tags (most common tags that exist in photos)
  const popularTags = ['Family', 'Church', 'Festival', 'Market', 'Traditional Dress', 'Group Photo']
    .filter(tag => availableTagsInPhotos.includes(tag));

  // Get categories that have available tags
  const categoriesWithTags = Object.entries(TAG_CATEGORIES).filter(([key, category]) => {
    return category.tags.some(tag => availableTagsInPhotos.includes(tag));
  });

  // Get tag count per category
  const getTagCountForCategory = (categoryKey: string) => {
    const category = TAG_CATEGORIES[categoryKey as keyof typeof TAG_CATEGORIES];
    return category ? category.tags.filter(tag => availableTagsInPhotos.includes(tag)).length : 0;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-700">Tags</span>
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedTags.length} selected
            </Badge>
          )}
        </div>
        {availableTagsInPhotos.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Less' : 'More Tags'}
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:bg-blue-500 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Popular Tags (Quick Access) - only show if there are available tags */}
      {!isExpanded && selectedTags.length === 0 && popularTags.length > 0 && (
        <div>
          <div className="text-sm text-gray-600 mb-2">Popular:</div>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 6).map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => handleTagToggle(tag)}
                className="text-xs hover:bg-blue-50 hover:border-blue-300"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* No tags available message */}
      {availableTagsInPhotos.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No tagged photos available yet</p>
        </div>
      )}

      {/* Expanded Tag Selector */}
      {isExpanded && availableTagsInPhotos.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs (only show if not searching and have categories with tags) */}
          {!searchQuery && categoriesWithTags.length > 0 && (
            <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200">
              {categoriesWithTags.map(([key, category]) => {
                const categoryTagCount = getTagCountForCategory(key);
                
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeCategory === key
                        ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="hidden sm:inline">{category.name}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categoryTagCount}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags Grid */}
          <div className="p-4">
            {filteredTags.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? (
                  <>
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No tags found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No tags available in this category</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {selectedTags.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing photos tagged with: <strong>{selectedTags.join(', ')}</strong>
        </div>
      )}
    </div>
  );
};

export default TagsFilter;