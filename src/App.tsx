import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CookieConsent } from "./components/CookieConsent";
import ErrorBoundary from "./components/ErrorBoundary";
import { lazy, Suspense } from 'react';

// ✅ LAZY LOAD routes (main performance optimization!)
const Index = lazy(() => import("./pages/Index"));
const Location = lazy(() => import("./pages/Location"));
const PhotoDetail = lazy(() => import("./pages/PhotoDetails"));
const MapView = lazy(() => import('./components/MapView'));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const CommunityLeaderboard = lazy(() => import("./pages/CommunityLeaderboard"));
const Notifications = lazy(() => import('./pages/Notifications'));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const Stories = lazy(() => import("./pages/Stories"));
const Photos = lazy(() => import("./pages/Photos"));
const StoryDetails = lazy(() => import("./pages/StoryDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Static imports (lightweight components)
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { OfflineIndicator } from './components/OfflineIndicator';
import ScrollToTop from "./components/ScrollToTop";

// ✅ OPTIMIZED: QueryClient with caching to reduce Firestore queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minuta - podaci su "svježi" 5 min (nema refetch)
      gcTime: 30 * 60 * 1000,        // 30 minuta - cache ostaje u memoriji
      retry: 1,                       // Samo 1 retry ako upit faila
      refetchOnWindowFocus: false,    // Ne refetchaj kad se vrati na tab
      refetchOnReconnect: 'always',   // Ali refetchaj kad se vrati internet
    },
  },
});

// Loading component za Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Učitavanje...</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/location/:locationName" element={<Location />} />
          <Route path="/photo/:photoId" element={<PhotoDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          <Route path="/community" element={<CommunityLeaderboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/story/:storyId" element={<StoryDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
      </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
          <ScrollToTop />
            <LanguageProvider>
              <AuthProvider>
                <Toaster />
                <CookieConsent />
                <AppContent />
              </AuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;