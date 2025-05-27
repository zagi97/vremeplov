
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { MOCK_PHOTOS } from "../utils/mockData";
import PhotoGrid from "../components/PhotoGrid";
import AddPostForm from "../components/AddPostForm";

const Location = () => {
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const [showAddForm, setShowAddForm] = useState(false);
  const [photos, setPhotos] = useState(MOCK_PHOTOS);

  const handleAddPost = (newPost: any) => {
    setPhotos(prev => [newPost, ...prev]);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
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

      {/* Add Post Form */}
      {showAddForm && (
        <section className="py-8 px-4 bg-white border-b">
          <div className="container max-w-6xl mx-auto">
            <AddPostForm 
              locationName={decodedLocationName}
              onClose={() => setShowAddForm(false)}
              onSubmit={handleAddPost}
            />
          </div>
        </section>
      )}

      {/* Feed Section */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <PhotoGrid photos={photos} />
          
          <div className="mt-12 text-center">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Load More Memories
            </Button>
          </div>
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
