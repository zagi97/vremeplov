// src/pages/Location.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import PhotoUpload from "../components/PhotoUpload";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from 'sonner';
import AuthButton from "../components/AuthButton";
import UserProfile from "../components/UserProfile";

const Location = () => {
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const [showAddForm, setShowAddForm] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PHOTOS_PER_PAGE = 10;

  // Load photos for this location
  useEffect(() => {
    const loadPhotos = async () => {
      if (!decodedLocationName) return;
      
      try {
        setLoading(true);
        const locationPhotos = await photoService.getPhotosByLocation(decodedLocationName);
         
        // Show first 10 photos initially
        const initialPhotos = locationPhotos.slice(0, PHOTOS_PER_PAGE);
        setPhotos(initialPhotos);
        setHasMore(locationPhotos.length > PHOTOS_PER_PAGE);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading photos:', error);
        toast.error('Failed to load photos');
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [decodedLocationName]);

  const loadMorePhotos = async () => {
    if (!decodedLocationName || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const locationPhotos = await photoService.getPhotosByLocation(decodedLocationName);
      
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * PHOTOS_PER_PAGE;
      const endIndex = nextPage * PHOTOS_PER_PAGE;
      const newPhotos = locationPhotos.slice(startIndex, endIndex);
      
      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < locationPhotos.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more photos:', error);
      toast.error('Failed to load more photos');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUploadSuccess = async () => {
    setShowAddForm(false);
    toast.success('Photo uploaded successfully! It will appear after admin review.');
    
    // Refresh the photos list to potentially show the new photo if it's approved
    try {
      const locationPhotos = await photoService.getPhotosByLocation(decodedLocationName);
      const currentPhotos = locationPhotos.slice(0, currentPage * PHOTOS_PER_PAGE);
      setPhotos(currentPhotos);
      setHasMore(locationPhotos.length > currentPage * PHOTOS_PER_PAGE);
    } catch (error) {
      console.error('Error refreshing photos:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
            <div className="flex items-center gap-4">
              <UserProfile className="text-white" />
              <AuthButton variant="outline" />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-end">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{decodedLocationName}</h2>
              <p className="text-gray-300">Explore the history of {decodedLocationName} through photos and memories</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Memory
            </Button>
          </div>
        </div>
      </header>

      {/* Upload Form */}
      {showAddForm && (
        <section className="py-8 px-4 bg-white border-b">
          <div className="container max-w-6xl mx-auto">
             <PhotoUpload 
              locationName={decodedLocationName}
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </section>
      )}

       {/* Feed Section */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <PhotoGrid photos={photos} />
          {hasMore && (
            <div className="mt-12 text-center">
              <Button 
                onClick={loadMorePhotos}
                disabled={loadingMore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loadingMore ? 'Loading...' : 'Load More Memories'}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
              <p className="mt-2">Preserving Croatian heritage, one memory at a time.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-white transition-colors">About</Link>
              <Link to="/" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Location;