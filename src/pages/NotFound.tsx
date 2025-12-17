import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {t('notFound.title')}
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">
            {t('notFound.heading')}
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('notFound.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('notFound.goBack')}
            </Button>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white w-full sm:w-auto flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" />
                {t('notFound.returnHome')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-8 text-gray-500 dark:text-gray-400">
          <p>
            <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              Vremeplov.hr
            </Link>
            {' — '}{t('notFound.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;