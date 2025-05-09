
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ElectionProvider } from "./contexts/ElectionContext";
import { SecurityKeyProvider } from "./contexts/SecurityKeyContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import OnboardingModal from "./components/OnboardingModal";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load page components for better performance
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Vote = lazy(() => import("./pages/Vote"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireCheckin = false,
  requireVote = false
}: { 
  children: JSX.Element, 
  requireAdmin?: boolean,
  requireSuperAdmin?: boolean,
  requireCheckin?: boolean,
  requireVote?: boolean
}) => {
  const { currentUser, userData, loading, isAdmin, isSuperAdmin, canAccessCheckin, canAccessVote } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <AccessDenied />;
  }
  
  if (requireAdmin && !isAdmin()) {
    return <AccessDenied />;
  }
  
  if (requireCheckin && !canAccessCheckin()) {
    return <AccessDenied />;
  }
  
  if (requireVote && !canAccessVote()) {
    return <AccessDenied />;
  }
  
  return children;
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ElectionProvider>
            <SecurityKeyProvider sessionDuration={60000}> {/* 1 minute session */}
              <OnboardingProvider>
                <OnboardingModal />
                <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
                  <Toaster />
                  <Sonner />
                  <div className="flex-grow">
                    <Suspense fallback={<LoadingScreen />}>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/access-denied" element={<AccessDenied />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                        
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Navigate to="/checkin" />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin" element={
                          <ProtectedRoute requireAdmin={true}>
                            <Admin />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/checkin" element={
                          <ProtectedRoute requireCheckin={true}>
                            <CheckIn />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/vote" element={
                          <ProtectedRoute requireVote={true}>
                            <Vote />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </div>
                  <Footer />
                </div>
              </OnboardingProvider>
            </SecurityKeyProvider>
          </ElectionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
