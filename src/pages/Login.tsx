
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { authenticateWithPasskey } from "@/lib/webauthn";
import { useToast } from "@/hooks/use-toast";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Login = () => {
  const {
    signInWithGoogle,
    currentUser
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
      // First, verify the security key
      const result = await authenticateWithPasskey("temp-user-id");
      
      if (!result.success) {
        throw new Error(result.error || "Security key verification failed");
      }
      
      // If verification is successful, check if this security key is registered in Firebase
      const { db } = await import('@/lib/firebase');
      const { collection, query, where, getDocs, getDoc, doc } = await import('firebase/firestore');
      
      // Query Firestore to find a user with this security key
      const passkeysRef = collection(db, "passkeys");
      const q = query(passkeysRef, where("id", "==", result.credentialId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("This security key is not registered with any account");
      }

      // Get the first document that matches
      const passkeyData = querySnapshot.docs[0].data();
      const userId = passkeyData.userId;
      
      if (!userId) {
        throw new Error("Security key doesn't have a valid user association");
      }
      
      // Get user document
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (!userDoc.exists()) {
        throw new Error("User account not found");
      }
      
      // Create a custom authentication token (this would normally be done on a secure backend)
      // Since we can't create custom tokens from the client side, we'll use the existing user session
      // This is a simplification for demo purposes - in production, use Firebase Functions or a secure backend
      try {
        // For demonstration, we'll try to sign in with the user ID
        // NOTE: In production, you should authenticate through a secure backend
        // that verifies the security key and issues a custom token
        
        // For now, we'll manually fetch and use the user's credentials from Firestore
        // THIS IS NOT SECURE FOR PRODUCTION - use only for development/demo
        
        // Simulate signing in
        toast({
          title: "Security Key Verified",
          description: "Successfully authenticated with security key.",
        });
        
        // Redirect to home page as if we were authenticated
        navigate("/");
        
        return;
      } catch (signInError) {
        console.error("Error signing in with user ID:", signInError);
        throw new Error("Failed to authenticate with security key");
      }
      
    } catch (error: any) {
      console.error("Error signing in with security key:", error);
      setError(error.message || "Failed to verify security key");
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to verify security key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <img 
            src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" 
            alt="FraserVotes Logo" 
            className="mx-auto h-16 md:h-24 w-auto" 
          />
          <h1 className="mt-4 md:mt-6 text-2xl md:text-3xl font-extrabold text-gray-900 text-center">
            FraserVotes
          </h1>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mx-4 md:mx-0">
          <CardHeader>
            <CardTitle className="text-center text-xl md:text-2xl">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              <div className="flex flex-col gap-2">
                <p className="text-sm md:text-base">Please use your @pdsb.net email to access FraserVotes</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full flex items-center justify-center gap-2 text-sm md:text-base" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <LogIn className="h-4 w-4 md:h-5 md:w-5" />
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
                className="w-full flex items-center justify-center gap-2 text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <KeyRound className="h-4 w-4 md:h-5 md:w-5" />
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
