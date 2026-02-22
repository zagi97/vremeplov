import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, BookOpen, Image, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import UserProfile from "@/components/UserProfile";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title?: string;
  showTitle?: boolean;
  fixed?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showTitle = true, fixed = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const headerRef = useRef<HTMLElement>(null);

  const isHomePage = location.pathname === "/";

  // Measure header height via useLayoutEffect - runs AFTER DOM update, BEFORE paint
  useLayoutEffect(() => {
    if (headerRef.current) {
      const bottom = headerRef.current.getBoundingClientRect().bottom;
      setHeaderHeight(Math.ceil(bottom));
    }
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const navLinks = [
    { to: "/photos", icon: Image, label: t("nav.gallery") || "Galerija" },
    { to: "/stories", icon: BookOpen, label: t("nav.stories") || "Priče" },
    { to: "/map", icon: MapPin, label: t("nav.memoryMapShort") || "Karta" },
  ];

  const isActiveLink = (path: string) => location.pathname === path;

  const headerBg = isHomePage && !menuOpen
    ? "bg-gray-900/30 backdrop-blur-md border-b border-white/10"
    : "bg-gray-900 border-b border-gray-800";

  // Mobile menu via portal - renders on document.body, bypasses all stacking contexts
  const mobileMenu = menuOpen
    ? createPortal(
        <>
          {/* Backdrop - starts BELOW header so header stays visible */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: headerHeight,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              background: "rgba(0,0,0,0.85)",
            }}
          />
          {/* Menu panel - positioned right below header */}
          <div
            style={{
              position: "fixed",
              top: headerHeight,
              left: 0,
              right: 0,
              zIndex: 99999,
              backgroundColor: "#111827",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <nav style={{ position: "static", zIndex: "auto", top: "auto", width: "auto", maxWidth: "72rem", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActiveLink(link.to)
                      ? "bg-white/15 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}

              <div className="flex items-center gap-3 px-3 py-3 border-t border-white/10 mt-1">
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </nav>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <header
        ref={headerRef}
        className={`w-full ${(fixed || menuOpen) ? "fixed" : "relative"} top-0 left-0 right-0 transition-all duration-300 ${headerBg} text-white`}
        style={{ zIndex: menuOpen ? 100000 : 50 }}
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
                <span className="md:hidden">{title ? title : "V.hr"}</span>
                <span className="hidden md:inline">{title || "Vremeplov.hr"}</span>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Desktop nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`hidden md:flex items-center text-white hover:text-gray-300 transition-colors text-sm font-medium px-2 py-1 gap-1 rounded-md hover:bg-white/10 ${
                  isActiveLink(link.to) ? "bg-white/15 text-white" : ""
                }`}
                aria-label={link.label}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs md:text-sm">{link.label}</span>
              </Link>
            ))}

            {/* Desktop only: theme & language */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />
            </div>

            {/* Always visible: notifications & profile */}
            <NotificationBell className="text-white hover:text-white" />
            <UserProfile className="text-white" />

            {/* Hamburger button - mobile only */}
            <Button
              variant="ghost"
              onClick={toggleMenu}
              className="md:hidden text-white hover:bg-white/10 p-1.5 transition-colors"
              aria-label={menuOpen ? "Zatvori izbornik" : "Otvori izbornik"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {mobileMenu}
    </>
  );
};

export default PageHeader;
