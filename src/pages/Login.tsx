
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { authenticateWithPasskey } from "@/lib/webauthn";

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
      const result = await authenticateWithPasskey("temp-user-id"); // We use a temporary ID since we don't have the user yet
      if (result.success) {
        // TODO: This is where you would integrate with your auth system
        // For now, we'll just show a success message
        toast({
          title: "Security Key Verified",
          description: "However, this feature is not fully integrated yet. Please use Google Sign In.",
          variant: "destructive",
        });
      } else {
        throw new Error(result.error || "Security key verification failed");
      }
    } catch (error: any) {
      console.error("Error signing in with security key:", error);
      setError(error.message || "Failed to verify security key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" alt="FraserVotes Logo" className="mx-auto h-24 w-auto" />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 text-center">FraserVotes</h1>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              <div className="flex flex-col gap-2">
                <p>Please use your @pdsb.net email to access FraserVotes</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full flex items-center justify-center gap-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                <span>Sign in with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                onClick={handleSecurityKeySignIn}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
                <span>Use Security Key</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
