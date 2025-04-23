
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Key, Loader2, Check, X } from "lucide-react";
import { authenticateWithPasskey, getPasskeys } from "@/lib/webauthn";
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
  const [hasKeys, setHasKeys] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (open && currentUser) {
      // Check if the user has any registered security keys
      checkForRegisteredKeys();
    }
  }, [open, currentUser]);
  
  const checkForRegisteredKeys = async () => {
    if (!currentUser) return;
    
    const keys = await getPasskeys(currentUser.uid);
    setHasKeys(keys.length > 0);
  };
  
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
      const result = await authenticateWithPasskey(currentUser.uid);
      
      if (result.success && result.verified) {
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Security Key Verification</DialogTitle>
          <DialogDescription>
            Please verify your identity using a registered security key
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {hasKeys === false && (
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-destructive mx-auto" />
              <div className="text-lg font-semibold">No Security Keys Found</div>
              <p className="text-sm text-muted-foreground">
                No security keys have been registered. Admin access to election results requires a physical security key.
              </p>
            </div>
          )}
          
          {hasKeys === true && verificationStep === 'initial' && (
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
