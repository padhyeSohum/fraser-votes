
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useOnboarding } from '../contexts/OnboardingContext';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  
  const steps = [
    {
      title: "Thank you for volunteering for SAC Elections 2025",
      description: "Here are a few important reminders",
      image: "/lovable-uploads/5435862e-b127-467a-acf3-887926a8e0d5.png"
    },
    {
      title: "Check-In Desk",
      description: "If you're working the check-in desk, remember to check all ID. Students can present drivers licenses, student IDs, health cards - anything with a picture and their name.",
      image: "/lovable-uploads/2e28b657-77e3-45d8-be18-df2303e29f26.png"
    },
    {
      title: "Poll Station",
      description: "Running a poll station? Please check in with Akshat, Aleena, or Cody for your secret pin. You'll have to enter this pin every time someone comes by to vote.",
      image: "/lovable-uploads/82fd17d5-71fa-4488-a841-1fcf61e61713.png"
    },
    {
      title: "Having Issues?",
      description: "If you have issues at any point, first try refreshing the page. Contact Akshat, Cody, or Aleena if you have further issues.",
      image: "/lovable-uploads/096dcf9a-ca07-490a-ae5f-c19b1118f6cb.png"
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save that onboarding is complete and redirect
      completeOnboarding();
      navigate('/');
    }
  };

  const handleSkip = () => {
    // Save that onboarding is complete and redirect
    completeOnboarding();
    navigate('/');
  };

  const handleClose = () => {
    // Save that onboarding is complete and redirect
    completeOnboarding();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-xl bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* Header Image */}
        <div className="relative bg-gray-900 h-64 flex items-center justify-center">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white"
            aria-label="Close onboarding"
          >
            <X size={24} />
          </button>
          <img
            src={steps[currentStep].image}
            alt="FraserVotes"
            className="w-auto h-32 object-contain"
          />
        </div>
        
        {/* Content */}
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600 text-lg mb-12 leading-relaxed">
            {steps[currentStep].description}
          </p>
          
          {/* Progress Dots */}
          <div className="flex space-x-2 mb-8">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={handleSkip} 
              className="text-gray-600"
            >
              Skip
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-2"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
