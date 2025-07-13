import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Page Not Found</h2>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 mb-6">
            The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-8 text-gray-500">
          <p>
            <Link to="/" className="text-blue-600 hover:underline">Vremeplov.hr</Link>
            {' — '}Preserving Croatian heritage, one memory at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;