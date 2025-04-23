import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticateWithPasskey } from "@/lib/webauthn";
import { useToast } from "@/hooks/use-toast";
const Login = () => {
  const {
    signInWithGoogle,
    signInWithPasskey,
    currentUser
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

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
      // Redirect will happen in the auth provider if successful
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for authentication. Please use the production URL or contact an administrator.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("Authentication cancelled. Please try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else {
        setError(error.message || "Sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSecurityKeySignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      // First, verify the security key without needing a specific user ID
      const result = await authenticateWithPasskey();
      if (!result.success) {
        throw new Error(result.error || "Security key verification failed");
      }
      console.log("Security key verified:", result);

      // Pass the role information to the sign-in function
      const signInSuccess = await signInWithPasskey(result.role);
      if (!signInSuccess) {
        throw new Error("Failed to authenticate with security key");
      }

      // Redirect to home page after successful login
      navigate("/");
    } catch (error: any) {
      console.error("Error signing in with security key:", error);
      setError(error.message || "Failed to verify security key");
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to verify security key",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <img src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" alt="FraserVotes Logo" className="mx-auto h-16 md:h-24 w-auto" />
          <h1 className="mt-4 md:mt-6 text-2xl md:text-3xl font-extrabold text-gray-900 text-center">
            FraserVotes
          </h1>
        </div>
        
        {error && <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl md:text-2xl">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Please use your @pdsb.net email to access FraserVotes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 text-sm md:text-base" disabled={isLoading}>
                {isLoading ? <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent rounded-full" /> : <LogIn className="h-4 w-4 md:h-5 md:w-5" />}
                <span>Sign in with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  
                </div>
              </div>

              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;