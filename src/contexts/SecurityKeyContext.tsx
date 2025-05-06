
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SecurityKeySession {
  verified: boolean;
  purpose?: 'election' | 'general' | 'admin';
  timestamp: number;
  expiresAt: number;
}

interface SecurityKeyContextType {
  securityKeySession: SecurityKeySession | null;
  setSecurityKeyVerified: (purpose?: 'election' | 'general' | 'admin') => void;
  clearSecurityKeySession: () => void;
  isSecurityKeyVerified: (purpose?: 'election' | 'general' | 'admin') => boolean;
  getTimeRemaining: () => number;
}

const SecurityKeyContext = createContext<SecurityKeyContextType | undefined>(undefined);

export const useSecurityKey = () => {
  const context = useContext(SecurityKeyContext);
  if (context === undefined) {
    throw new Error('useSecurityKey must be used within a SecurityKeyProvider');
  }
  return context;
};

interface SecurityKeyProviderProps {
  children: ReactNode;
  sessionDuration?: number; // In milliseconds
}

export const SecurityKeyProvider: React.FC<SecurityKeyProviderProps> = ({ 
  children,
  sessionDuration = 60000 // Default 1 minute
}) => {
  const [securityKeySession, setSecurityKeySession] = useState<SecurityKeySession | null>(null);
  
  // Clear session when it expires
  useEffect(() => {
    if (!securityKeySession) return;
    
    const timeLeft = securityKeySession.expiresAt - Date.now();
    if (timeLeft <= 0) {
      clearSecurityKeySession();
      return;
    }
    
    const timerId = setTimeout(() => {
      clearSecurityKeySession();
    }, timeLeft);
    
    return () => clearTimeout(timerId);
  }, [securityKeySession]);
  
  const setSecurityKeyVerified = (purpose?: 'election' | 'general' | 'admin') => {
    const now = Date.now();
    setSecurityKeySession({
      verified: true,
      purpose,
      timestamp: now,
      expiresAt: now + sessionDuration
    });
    console.log(`Security key verified for ${purpose || 'general'} purpose. Valid for ${sessionDuration/1000}s`);
  };
  
  const clearSecurityKeySession = () => {
    setSecurityKeySession(null);
  };
  
  const isSecurityKeyVerified = (purpose?: 'election' | 'general' | 'admin'): boolean => {
    if (!securityKeySession) return false;
    
    // Check if session is still valid
    if (Date.now() > securityKeySession.expiresAt) {
      clearSecurityKeySession();
      return false;
    }
    
    // If no specific purpose is required or purposes match
    if (!purpose || !securityKeySession.purpose || purpose === securityKeySession.purpose) {
      return securityKeySession.verified;
    }
    
    return false;
  };
  
  const getTimeRemaining = (): number => {
    if (!securityKeySession) return 0;
    const remaining = securityKeySession.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  };
  
  return (
    <SecurityKeyContext.Provider value={{
      securityKeySession,
      setSecurityKeyVerified,
      clearSecurityKeySession,
      isSecurityKeyVerified,
      getTimeRemaining
    }}>
      {children}
    </SecurityKeyContext.Provider>
  );
};

export default SecurityKeyContext;
