
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';

const OnboardingModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { showOnboarding } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Only navigate if both checks pass - this prevents unnecessary navigation
    if (currentUser && showOnboarding && window.location.pathname !== '/onboarding') {
      // Use immediate navigation but within a microtask to avoid blocking rendering
      Promise.resolve().then(() => {
        navigate('/onboarding');
      });
    }
  }, [currentUser, showOnboarding, navigate]);

  // Return null as this is a non-rendering component
  return null;
};

export default OnboardingModal;
