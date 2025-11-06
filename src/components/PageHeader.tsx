import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import UserProfile from "@/components/UserProfile";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title?: string;
  showTitle?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showTitle = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isHomePage = location.pathname === "/";

  return (
    <header
      className={`w-full z-50 fixed top-0 left-0 right-0 ${
        isHomePage
          ? "bg-black/20 backdrop-blur-sm"
          : "bg-gray-900"
      } text-white`}
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isHomePage && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 p-2"
              aria-label="Natrag"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showTitle && (
            <Link
              to="/"
              className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate hover:text-gray-200 transition-colors"
            >
              {title || "Vremeplov.hr"}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Map View link */}
          <Link
            to="/map"
            className="flex items-center text-white hover:text-gray-300 transition-colors text-sm font-medium px-2 py-1 gap-1 rounded-md hover:bg-white/10"
            aria-label={t("nav.memoryMapShort") || "Karta"}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline text-xs md:text-sm">
              {t("nav.memoryMapShort")}
            </span>
          </Link>

          <LanguageSelector />
          <NotificationBell className="text-white hover:text-white" />
          <UserProfile className="text-white" />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;