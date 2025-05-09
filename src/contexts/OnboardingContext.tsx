
import React, { createContext, useContext, useState, useEffect } from 'react';

type OnboardingContextType = {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if the user has completed onboarding
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };
  
  const resetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    setShowOnboarding(true);
  };

  return (
    <OnboardingContext.Provider value={{ showOnboarding, completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
