
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

export interface SecurityKeyCredential {
  id: string;
  publicKey: string;
  name: string;
  createdAt: any;
  userId: string;
}

// Generate a random challenge string in base64URL format
export const generateChallenge = (): string => {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return arrayBufferToBase64URL(arr.buffer);
};

// Register a new security key
export const registerSecurityKey = async (userId: string, keyName: string) => {
  try {
    // Generate a challenge
    const challenge = generateChallenge();
    
    // Store challenge temporarily in session storage
    sessionStorage.setItem('webauthn_challenge', challenge);
    
    // Get existing registered credentials for this user to prevent duplicates
    const existingCredentials = await getSecurityKeyCredentials(userId);
    
    // Properly define transports with correct type
    const excludeCredentials = existingCredentials.map(cred => ({
      id: cred.id, // Use the base64URL string for SimpleWebAuthn
      type: 'public-key' as const,
      transports: ['usb', 'ble', 'nfc', 'internal'] as ('usb' | 'ble' | 'nfc' | 'internal')[]
    }));

    // Start registration process
    const registrationOptions = {
      challenge, // Already in base64URL format
      rp: {
        name: 'FraserVotes',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: userId,
        displayName: keyName
      },
      pubKeyCredParams: [
        { type: 'public-key' as const, alg: -7 },
        { type: 'public-key' as const, alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform' as const,
        userVerification: 'required' as const,
        residentKey: 'preferred' as const
      },
      timeout: 60000,
      attestation: 'none' as const,
      excludeCredentials
    };

    // Convert the challenge string to ArrayBuffer for startRegistration
    // This fixes the error on line 71
    const challengeBuffer = base64URLToArrayBuffer(challenge);
    registrationOptions.challenge = challengeBuffer;

    // Start the registration process
    const registration = await startRegistration(registrationOptions);
    
    // Store the credential in Firestore
    const credential: SecurityKeyCredential = {
      id: arrayBufferToBase64URL(registration.rawId),
      publicKey: btoa(JSON.stringify(registration)),
      name: keyName,
      createdAt: new Date(),
      userId
    };

    // Save to Firestore
    const keyRef = doc(collection(db, "securityKeys"));
    await setDoc(keyRef, credential);
    
    return { success: true, credential };
  } catch (error) {
    console.error('Error registering security key:', error);
    return { success: false, error };
  }
};

// Authenticate with a security key
export const authenticateWithSecurityKey = async (userId: string) => {
  try {
    // Generate a challenge
    const challenge = generateChallenge();
    
    // Store challenge temporarily in session storage
    sessionStorage.setItem('webauthn_challenge', challenge);
    
    // Get existing credentials for this user
    const existingCredentials = await getSecurityKeyCredentials(userId);
    if (existingCredentials.length === 0) {
      throw new Error('No security keys registered for this user');
    }

    // Properly define transports with correct type
    const allowCredentials = existingCredentials.map(cred => ({
      id: cred.id, // Use the base64URL string for SimpleWebAuthn
      type: 'public-key' as const,
      transports: ['usb', 'ble', 'nfc', 'internal'] as ('usb' | 'ble' | 'nfc' | 'internal')[]
    }));

    // Start authentication process
    const authOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials,
      timeout: 60000,
      userVerification: 'required' as const
    };

    // Convert the challenge string to ArrayBuffer for startAuthentication
    // This fixes the error on line 124
    const challengeBuffer = base64URLToArrayBuffer(challenge);
    authOptions.challenge = challengeBuffer;

    // Start the authentication process
    const authentication = await startAuthentication(authOptions);
    
    // Verify the credential ID matches one of our stored credentials
    const credentialIdBase64 = arrayBufferToBase64URL(authentication.rawId);
    const matchedCredential = existingCredentials.find(cred => cred.id === credentialIdBase64);
    
    if (!matchedCredential) {
      throw new Error('Unknown security key');
    }
    
    return { success: true, verified: true };
  } catch (error) {
    console.error('Error authenticating with security key:', error);
    return { success: false, error };
  }
};

// Get all security keys registered for a user
export const getSecurityKeyCredentials = async (userId: string): Promise<SecurityKeyCredential[]> => {
  try {
    const q = query(collection(db, "securityKeys"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const credentials: SecurityKeyCredential[] = [];
    querySnapshot.forEach((doc) => {
      credentials.push(doc.data() as SecurityKeyCredential);
    });
    
    return credentials;
  } catch (error) {
    console.error('Error fetching security keys:', error);
    return [];
  }
};

// Remove a security key
export const removeSecurityKey = async (credentialId: string) => {
  try {
    const q = query(collection(db, "securityKeys"), where("id", "==", credentialId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Security key not found' };
    }
    
    // Mark as deleted (soft delete)
    const docRef = doc(db, "securityKeys", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      deleted: true,
      deletedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error removing security key:', error);
    return { success: false, error };
  }
};

// Helper function to convert ArrayBuffer to Base64URL string
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  const base64 = btoa(binary);
  // Convert to base64url format by replacing characters that are problematic in URLs
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper function to convert base64url string to ArrayBuffer
function base64URLToArrayBuffer(base64URLString: string): ArrayBuffer {
  // Base64 URL decoding
  const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  
  const binary = atob(padded);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return array.buffer;
}
