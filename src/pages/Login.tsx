
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, AlertCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img
            src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
            alt="FraserVotes Logo"
            className="mx-auto h-16 w-auto"
          />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            FraserVotes
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Sign in with your PDSB account to continue
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGoogleSignIn}
          className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl"
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
      </div>
    </div>
  );
};

export default Login;
