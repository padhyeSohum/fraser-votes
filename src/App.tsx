import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ElectionProvider } from "./contexts/ElectionContext";

// Pages
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import CheckIn from "./pages/CheckIn";
import Vote from "./pages/Vote";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
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
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
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
          </BrowserRouter>
        </TooltipProvider>
      </ElectionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
