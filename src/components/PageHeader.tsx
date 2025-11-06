import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import UserProfile from "@/components/UserProfile";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title?: string; // optional, možeš ga slati ako želiš prikaz naslova stranice
  showTitle?: boolean; // ako želiš moći sakriti naslov
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showTitle = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isHomePage = location.pathname === "/";

  return (
    <header
      className={`w-full z-50 ${
        isHomePage
          ? "absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm"
          : "bg-gradient-to-r from-gray-900 to-gray-800"
      } text-white`}
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {!isHomePage && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showTitle && (
            <Link
              to="/"
              className="text-xl md:text-2xl font-bold text-white truncate"
            >
              {title || "Vremeplov.hr"}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Map View link */}
          <Link
            to="/map"
            className="flex items-center text-white hover:text-blue-300 transition-colors text-sm font-medium px-2 py-1 gap-1"
            aria-label={t("nav.memoryMapShort") || "Memory Map"}
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
