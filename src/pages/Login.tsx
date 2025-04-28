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
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8 animate-scale-in">
          <img src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" alt="FraserVotes Logo" className="mx-auto h-20 md:h-28 w-auto drop-shadow-md" />
          <h1 className="mt-4 md:mt-6 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center font-heading">
            FraserVotes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Student voting made simple
          </p>
        </div>
        
        {error && <Alert variant="destructive" className="mb-6 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>}
        
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl md:text-3xl font-heading">Sign In</CardTitle>
            <CardDescription className="text-center text-sm md:text-base">
              Please use your @pdsb.net email to access FraserVotes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-4">
              <Button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 text-base font-medium h-12 button-hover" disabled={isLoading} variant="default">
                {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <LogIn className="h-5 w-5" />}
                <span>Sign in with Google</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        
      </div>
    </div>;
};
export default Login;