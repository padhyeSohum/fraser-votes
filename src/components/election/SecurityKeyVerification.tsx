
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Loader2, Check, X } from "lucide-react";
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
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [verificationStep, setVerificationStep] = useState<'initial' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleVerify = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to verify a security key",
        variant: "destructive",
      });
      return;
    }
    
    setVerificationStep('verifying');
    
    try {
      console.log("Verifying with election purpose key");
      const result = await authenticateWithPasskey(currentUser.uid, 'election');
      
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Security Key Required</DialogTitle>
          <DialogDescription>
            Please verify your identity using an election security key to view results
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {verificationStep === 'initial' && (
            <div className="text-center space-y-4">
              <Key className="h-12 w-12 text-primary mx-auto" />
              <div className="text-lg font-semibold">Connect Your Election Security Key</div>
              <p className="text-sm text-muted-foreground">
                Insert your election security key and click the button below to verify
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
            </div>
          )}
          
          {verificationStep === 'success' && (
            <div className="text-center space-y-4">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <div className="text-lg font-semibold">Verification Successful</div>
              <p className="text-sm text-muted-foreground">
                You now have access to the election results
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
              <Button onClick={handleVerify} className="mt-2">
                Try Again
              </Button>
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
