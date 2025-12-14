import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import UserProfile from "@/components/UserProfile";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title?: string;
  showTitle?: boolean;
  fixed?: boolean; // ✅ NOVI PROP
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showTitle = true, fixed = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isHomePage = location.pathname === "/";

  return (
    <header
      className={`w-full z-50 ${fixed ? 'fixed' : 'relative'} top-0 left-0 right-0 transition-all duration-300 ${
        isHomePage
          ? "bg-gray-900/30 backdrop-blur-md border-b border-white/10"
          : "bg-gray-900 border-b border-gray-800"
      } text-white`}
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Left side */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
          {!isHomePage && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 p-1.5 sm:p-2 transition-colors flex-shrink-0"
              aria-label="Natrag"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          {showTitle && (
            <Link
              to="/"
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate hover:text-gray-200 transition-colors"
            >
              {title || "Vremeplov.hr"}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Map View link */}
          <Link
            to="/map"
            className="flex items-center text-white hover:text-gray-300 transition-colors text-sm font-medium px-1.5 sm:px-2 py-1 gap-1 rounded-md hover:bg-white/10"
            aria-label={t("nav.memoryMapShort") || "Karta"}
          >
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden md:inline text-xs md:text-sm">
              {t("nav.memoryMapShort")}
            </span>
          </Link>

          <ThemeToggle />
          <LanguageSelector />
          <NotificationBell className="text-white hover:text-white" />
          <UserProfile className="text-white" />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;