
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticateWithPasskey } from "@/lib/webauthn";

const Login = () => {
  const { signInWithGoogle, signInWithPasskey, currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (currentUser) {
    navigate("/");
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized. Please use your PDSB account.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in window was closed. Please try again.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityKeySignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await authenticateWithPasskey();
      if (!result.success) {
        throw new Error(result.error || "Security key verification failed");
      }
      await signInWithPasskey(result.role);
      navigate("/");
    } catch (error: any) {
      console.error("Security key error:", error);
      setError("Security key verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <img
            src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
            alt="FraserVotes Logo"
            className="mx-auto h-20 w-auto"
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            FraserVotes
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your PDSB account to continue
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden apple-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-medium">Welcome back</CardTitle>
            <CardDescription>
              Choose your sign-in method below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full h-11 text-base font-medium bg-accent hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in with Google
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
