import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
const Login = () => {
  const {
    signInWithGoogle,
    currentUser
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // If already logged in, redirect
  if (currentUser) {
    navigate("/");
    return null;
  }
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // Redirect will happen in the auth provider
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for authentication. Please use the production URL or contact an administrator.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("Authentication cancelled. Please try again.");
      } else {
        setError(error.message || "Sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" alt="FraserVotes Logo" className="mx-auto h-24 w-auto" />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">FraserVotes</h1>
          <p className="mt-2 text-sm text-gray-600">School Election Platform</p>
        </div>
        
        {error && <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">Please use your @pdsb.net email to access FraserVotes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <LogIn className="h-5 w-5" />}
                <span>Sign in with Google</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-gray-500">
            Only @pdsb.net accounts are authorized to access this system
          </CardFooter>
        </Card>
        
        
      </div>
    </div>;
};
export default Login;