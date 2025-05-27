// src/App.tsx
// Remove this line since toaster is deprecated
// import { Toaster } from "./components/ui/toaster";
import { Toaster } from "./components/ui/sonner"; // Use Toaster from sonner
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Location from "./pages/Location";
import PhotoDetail from "./pages/PhotoDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* No need for Sonner component since we're using Toaster from sonner */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/location/:locationName" element={<Location />} />
          <Route path="/photo/:photoId" element={<PhotoDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;