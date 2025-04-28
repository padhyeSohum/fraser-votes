
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogIn, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import SecurityKeyVerification from "@/components/election/SecurityKeyVerification";
import { useElection } from "@/contexts/ElectionContext";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const { signInWithGoogle, signInWithPasskey, currentUser } = useAuth();
  const { settings } = useElection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [kioskPin, setKioskPin] = useState("");
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [showSecurityKeyPrompt, setShowSecurityKeyPrompt] = useState(false);
  const [pinError, setPinError] = useState("");
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

  const validateKioskPin = () => {
    setPinError("");
    
    // Check legacy pin first for backward compatibility
    if (kioskPin === settings.pinCode) {
      setShowSecurityKeyPrompt(true);
      return;
    }
    
    // Then check the pins array
    if (settings.pins && settings.pins.length > 0) {
      const validPin = settings.pins.find(
        p => p.pin === kioskPin && p.isActive
      );
      
      if (validPin) {
        setShowSecurityKeyPrompt(true);
        return;
      }
    }
    
    setPinError("Invalid PIN. Please try again.");
  };

  const handleSecurityKeySuccess = async () => {
    // Navigate to vote page in kiosk mode
    localStorage.setItem('kioskMode', 'true');
    navigate("/vote");
  };

  const toggleMode = () => {
    setIsKioskMode(!isKioskMode);
    setKioskPin("");
    setPinError("");
    setError("");
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
            {isKioskMode ? "Kiosk Mode Access" : "Sign in with your PDSB account to continue"}
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
            <CardTitle className="text-2xl font-medium">
              {isKioskMode ? "Kiosk Mode" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isKioskMode 
                ? "Enter voting PIN to access kiosk mode"
                : "Choose your sign-in method below"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isKioskMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter voting PIN"
                    value={kioskPin}
                    onChange={(e) => setKioskPin(e.target.value)}
                    className="text-center text-xl tracking-widest"
                  />
                  {pinError && (
                    <p className="text-sm text-red-500 text-center">{pinError}</p>
                  )}
                </div>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={validateKioskPin}
                  disabled={!kioskPin}
                >
                  <Lock className="mr-2 h-5 w-5" />
                  Verify PIN
                </Button>
              </div>
            ) : (
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
            )}
          </CardContent>
          
          <Separator className="my-4" />
          
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={toggleMode}
            >
              {isKioskMode ? "← Back to regular sign in" : "Switch to kiosk mode"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <SecurityKeyVerification
        open={showSecurityKeyPrompt}
        onOpenChange={setShowSecurityKeyPrompt}
        onSuccess={handleSecurityKeySuccess}
        onCancel={() => setShowSecurityKeyPrompt(false)}
      />
    </div>
  );
};

export default Login;
