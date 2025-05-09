
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
    // Use a more performant approach with a single condition
    if (currentUser && showOnboarding && window.location.pathname !== '/onboarding') {
      // Use requestAnimationFrame for smoother navigation
      requestAnimationFrame(() => {
        navigate('/onboarding');
      });
    }
  }, [currentUser, showOnboarding, navigate]);

  // Return null as this is a non-rendering component
  return null;
};

export default OnboardingModal;
