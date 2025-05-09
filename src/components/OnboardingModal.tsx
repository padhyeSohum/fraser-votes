
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';

const OnboardingModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { showOnboarding } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Only check for onboarding status after user is authenticated
    if (currentUser && showOnboarding) {
      // Automatically navigate to onboarding page if needed
      if (window.location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    }
  }, [currentUser, showOnboarding, navigate]);

  return null; // The component doesn't render anything as navigation is handled via useEffect
};

export default OnboardingModal;
