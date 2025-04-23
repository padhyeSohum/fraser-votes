
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
  const { toast } = useToast();
  const [verificationStep, setVerificationStep] = useState<'initial' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleVerify = async () => {
    setVerificationStep('verifying');
    
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Security Key Required</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Please verify your identity using an election security key to view results
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 md:py-6 space-y-4">
          {verificationStep === 'initial' && (
            <div className="text-center space-y-3 md:space-y-4">
              <Key className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto" />
              <div className="text-base md:text-lg font-semibold">Connect Your Election Security Key</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Insert your election security key and click the button below to verify
              </p>
              <Button onClick={handleVerify} className="mt-2 w-full md:w-auto">
                Verify Security Key
              </Button>
            </div>
          )}
          
          {verificationStep === 'verifying' && (
            <div className="text-center space-y-3 md:space-y-4">
              <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto animate-spin" />
              <div className="text-base md:text-lg font-semibold">Verifying...</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Follow the security key prompts on your device
              </p>
            </div>
          )}
          
          {verificationStep === 'success' && (
            <div className="text-center space-y-3 md:space-y-4">
              <Check className="h-10 w-10 md:h-12 md:w-12 text-green-500 mx-auto" />
              <div className="text-base md:text-lg font-semibold">Verification Successful</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                You now have access to the election results
              </p>
            </div>
          )}
          
          {verificationStep === 'error' && (
            <div className="text-center space-y-3 md:space-y-4">
              <X className="h-10 w-10 md:h-12 md:w-12 text-destructive mx-auto" />
              <div className="text-base md:text-lg font-semibold">Verification Failed</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {errorMessage || 'Unable to verify security key'}
              </p>
              <Button onClick={handleVerify} className="mt-2 w-full md:w-auto">
                Try Again
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={verificationStep === 'verifying'}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityKeyVerification;
