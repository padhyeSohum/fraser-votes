
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ElectionProvider } from "./contexts/ElectionContext";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load page components for better performance
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Vote = lazy(() => import("./pages/Vote"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false
}: { 
  children: JSX.Element, 
  requireAdmin?: boolean,
  requireSuperAdmin?: boolean
}) => {
  const { currentUser, userData, loading, isAdmin, isSuperAdmin } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/" />;
  }
  
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ElectionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <div className="flex-grow">
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={
                      <ProtectedRoute>
                        <CheckIn />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                      <ProtectedRoute requireAdmin={true}>
                        <Admin />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/checkin" element={
                      <ProtectedRoute>
                        <CheckIn />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vote" element={
                      <ProtectedRoute>
                        <Vote />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ElectionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
