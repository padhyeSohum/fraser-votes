
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Loader2, Check, X, RefreshCw } from "lucide-react";
import { authenticateWithPasskey } from "@/lib/webauthn";
import { useSecurityKey } from "@/contexts/SecurityKeyContext";

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
  const { isSecurityKeyVerified, setSecurityKeyVerified } = useSecurityKey();
  const [verificationStep, setVerificationStep] = useState<'initial' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Check if already verified when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationStep('initial');
      setErrorMessage('');
      
      // If already verified in the last minute, auto-succeed
      if (isSecurityKeyVerified('admin')) {
        console.log("Security key already verified within the session period");
        setVerificationStep('success');
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    }
  }, [open, isSecurityKeyVerified, onSuccess]);
  
  const handleVerify = async () => {
    setVerificationStep('verifying');
    setErrorMessage('');
    
    try {
      const result = await authenticateWithPasskey();
      
      if (result.success && result.verified) {
        console.log("Security key verification successful");
        // Set the security key as verified for the session duration
        setSecurityKeyVerified('admin');
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
        description: error.message || "Failed to verify security key",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Security Key Verification</DialogTitle>
          <DialogDescription>
            Please verify your identity using a registered security key
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {verificationStep === 'initial' && (
            <div className="text-center space-y-4">
              <Key className="h-12 w-12 text-primary mx-auto" />
              <div className="text-lg font-semibold">Connect Your Security Key</div>
              <p className="text-sm text-muted-foreground">
                Insert your security key and click the button below to verify
              </p>
              <Button onClick={handleVerify} className="mt-2">
                Verify Security Key
              </Button>
            </div>
          )}
          
          {verificationStep === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
              <div className="text-lg font-semibold">Verifying...</div>
              <p className="text-sm text-muted-foreground">
                Follow the security key prompts on your device
              </p>
              <Button variant="ghost" onClick={handleReset} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Cancel and Retry
              </Button>
            </div>
          )}
          
          {verificationStep === 'success' && (
            <div className="text-center space-y-4">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <div className="text-lg font-semibold">Verification Successful</div>
              <p className="text-sm text-muted-foreground">
                You now have access to the requested content
              </p>
            </div>
          )}
          
          {verificationStep === 'error' && (
            <div className="text-center space-y-4">
              <X className="h-12 w-12 text-destructive mx-auto" />
              <div className="text-lg font-semibold">Verification Failed</div>
              <p className="text-sm text-muted-foreground">
                {errorMessage || 'Unable to verify security key'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleVerify} className="mt-2">
                  Try Again
                </Button>
                <Button variant="ghost" onClick={handleReset} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={verificationStep === 'verifying'}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityKeyVerification;
