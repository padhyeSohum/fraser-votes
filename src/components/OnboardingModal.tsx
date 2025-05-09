
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';

const OnboardingModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { showOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only navigate if all conditions are met and prevent navigation loops
    if (
      currentUser && 
      showOnboarding && 
      location.pathname !== '/onboarding'
    ) {
      // Use immediate navigation without microtask to prevent rendering issues
      navigate('/onboarding', { replace: true });
    }
  }, [currentUser, showOnboarding, navigate, location.pathname]);

  // Return null as this is a non-rendering component
  return null;
};

export default OnboardingModal;
