
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from '../pages/Onboarding';

interface OnboardingModalProps {
  isAuthenticated: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isAuthenticated }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show onboarding if user is authenticated and hasn't completed onboarding
    if (isAuthenticated && !localStorage.getItem('onboardingComplete')) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated]);

  if (!showOnboarding) return null;

  return <Onboarding />;
};

export default OnboardingModal;
