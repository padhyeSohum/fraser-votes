
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const Footer = () => {
  const resetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    window.location.reload();
  };

  return (
    <footer className="w-full py-4 px-4 mt-auto border-t border-gray-200/50 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-center">
        <span className="text-sm text-gray-500">
          FraserVotes made with 🖤 by Akshat Chopra
        </span>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2 text-xs text-gray-400">
              Reset Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Onboarding</DialogTitle>
              <DialogDescription>
                This will reset the onboarding experience. You'll see the onboarding screens next time you log in.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="default" onClick={resetOnboarding}>
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
};

export default Footer;
