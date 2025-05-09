
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from '../pages/Onboarding';
import { useAuth } from '../contexts/AuthContext';

const OnboardingModal: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only check for onboarding status after user is authenticated
    if (currentUser) {
      // Check if the user has seen the onboarding
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      
      if (!onboardingComplete) {
        setShowOnboarding(true);
        
        // Automatically navigate to onboarding page if needed
        if (window.location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
      }
    }
  }, [currentUser, navigate]);

  return null; // The component doesn't render anything as navigation is handled via useEffect
};

export default OnboardingModal;
