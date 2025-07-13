import { Toaster } from "./components/ui/sonner";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import Location from "./pages/Location";
import PhotoDetail from "./pages/PhotoDetails";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Vremeplov...</p>
        </div>
      </div>
    );
  }

 
  // Only check auth for exact valid routes, let everything else go to 404
  const exactValidPaths = ['/', '/dashboard', '/admin', '/about', '/privacy', '/terms', '/contact', '/admin-login'];
  const dynamicValidPaths = ['/location/', '/photo/'];
  const currentPath = window.location.pathname;
  
  const isExactMatch = exactValidPaths.includes(currentPath);
  const isDynamicMatch = dynamicValidPaths.some(path => currentPath.startsWith(path) && currentPath.length > path.length);
  const isValidPath = isExactMatch || isDynamicMatch;
  
  if (!user && isValidPath && currentPath !== '/admin-login') {
    return <Login />;
  }
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
       <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/location/:locationName" element={<Location />} />
      <Route path="/photo/:photoId" element={<PhotoDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;