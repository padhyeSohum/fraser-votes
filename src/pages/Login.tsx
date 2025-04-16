
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

const Login = () => {
  const { signInWithGoogle, currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect
  if (currentUser) {
    navigate("/");
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Redirect will happen in the auth provider
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/98dcbb62-4d86-4964-8a30-848234660652.png" 
            alt="FraserVotes Logo" 
            className="mx-auto h-24 w-auto" 
          />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">FraserVotes</h1>
          <p className="mt-2 text-sm text-gray-600">School Election Platform</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Please use your @pdsb.net email to access the voting system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <LogIn className="h-5 w-5" />
                <span>Sign in with Google</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-gray-500">
            Only @pdsb.net accounts are authorized to access this system
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
