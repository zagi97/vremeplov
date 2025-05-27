
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MOCK_PHOTOS } from "../utils/mockData";
import PhotoGrid from "../components/PhotoGrid";

const Location = () => {
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

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
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{decodedLocationName}</h2>
            <p className="text-gray-300">Explore the history of {decodedLocationName} through photos and memories</p>
          </div>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <PhotoGrid photos={MOCK_PHOTOS} />
          
          <div className="mt-12 text-center">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Load More Memories
            </Button>
          </div>
        </div>
      </section>

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
