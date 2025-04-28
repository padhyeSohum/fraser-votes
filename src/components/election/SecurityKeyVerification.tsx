
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Loader2, Check, X, RefreshCw } from "lucide-react";
import { authenticateWithPasskey } from "@/lib/webauthn";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityKeyVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

const SecurityKeyVerification: React.FC<SecurityKeyVerificationProps> = ({ 
  open, 
  onOpenChange,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [verificationStep, setVerificationStep] = useState<'initial' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationStep('initial');
      setErrorMessage('');
    }
  }, [open]);

  const handleVerify = async () => {
    setVerificationStep('verifying');
    setErrorMessage('');
    
    try {
      console.log("Verifying with election purpose key");
      const result = await authenticateWithPasskey('election');
      
      if (result.success && result.verified) {
        console.log("Security key verification successful");
        setVerificationStep('success');
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Security key verification error:', error);
      setErrorMessage(error.message || 'Failed to verify security key');
      setVerificationStep('error');
      
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify election security key",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setVerificationStep('initial');
    setErrorMessage('');
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onCancel();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto apple-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight">Security Key Required</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Please verify your identity using an election security key
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {verificationStep === 'initial' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <Key className="h-8 w-8 text-accent" />
              </div>
              <div className="text-lg font-medium">Connect Your Security Key</div>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                Insert your election security key and tap the button below to verify
              </p>
              <Button 
                onClick={handleVerify} 
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Verify Security Key
              </Button>
            </div>
          )}
          
          {verificationStep === 'verifying' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              </div>
              <div className="text-lg font-medium">Verifying...</div>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                Follow the security key prompts on your device
              </p>
              <Button variant="ghost" onClick={handleReset} size="sm" className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Cancel and Retry
              </Button>
            </div>
          )}
          
          {verificationStep === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-lg font-medium text-green-500">Verification Successful</div>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                You now have access to the election results
              </p>
            </div>
          )}
          
          {verificationStep === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-lg font-medium text-destructive">Verification Failed</div>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                {errorMessage || 'Unable to verify security key'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleVerify}
                  className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset} 
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={verificationStep === 'verifying'}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityKeyVerification;
