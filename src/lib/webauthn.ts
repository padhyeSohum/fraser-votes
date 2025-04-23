
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  userHandle?: string; // Made optional
  createdAt: any;
  userId?: string; // Made optional
  deviceName?: string;
  registeredBy?: string;
  purpose?: 'election' | 'general';
  role?: 'superadmin' | 'admin' | 'staff'; // Added role for authorization level
}

// Helper function to convert base64 strings to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper function to convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; bytes.byteLength > i; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const registerPasskey = async (deviceName?: string, superadminId?: string, role: string = 'admin', purpose: 'election' | 'general' = 'general') => {
  try {
    if (!superadminId) {
      throw new Error('Only superadmins can register passkeys');
    }

    // Generate random challenge as a base64 string
    const challengeString = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challengeString);
    
    // Use a generic ID for all security keys
    const genericId = 'security-key-user';
    
    const registrationOptions = {
      challenge: challengeString,
      rp: {
        name: 'FraserVotes',
        id: window.location.hostname
      },
      user: {
        id: genericId,
        name: deviceName || 'FraserVotes Security Key',
        displayName: deviceName || 'Security Key'
      },
      pubKeyCredParams: [
        { type: 'public-key' as const, alg: -7 },   // ES256
        { type: 'public-key' as const, alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        residentKey: "required" as const,
        userVerification: "required" as const
      },
      timeout: 60000,
      attestation: 'none' as const
    };

    const registration = await startRegistration(registrationOptions);
    
    const credential: PasskeyCredential = {
      id: registration.id,
      publicKey: btoa(JSON.stringify(registration)),
      createdAt: new Date(),
      deviceName,
      registeredBy: superadminId,
      purpose,
      role // Add the role to the credential
    };

    const keyRef = doc(collection(db, "passkeys"));
    await setDoc(keyRef, credential);
    
    return { success: true, credential };
  } catch (error) {
    console.error('Error registering passkey:', error);
    return { success: false, error };
  }
};

export const authenticateWithPasskey = async (purpose?: 'election' | 'general') => {
  try {
    console.log(`Authenticating with purpose: ${purpose || 'general'}`);
    const challengeString = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challengeString);

    const authOptions = {
      challenge: challengeString,
      rpId: window.location.hostname,
      timeout: 60000,
      userVerification: 'required' as const
    };

    const authentication = await startAuthentication(authOptions);
    const credentialId = authentication.id;
    
    // Create a query to find the credential by ID only
    let q = query(
      collection(db, "passkeys"), 
      where("id", "==", credentialId)
    );
    
    // If purpose is specified, also filter by purpose
    if (purpose) {
      q = query(
        collection(db, "passkeys"), 
        where("id", "==", credentialId),
        where("purpose", "==", purpose)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`No matching passkey found with purpose: ${purpose || 'general'}`);
      throw new Error(`Unknown or invalid passkey for ${purpose || 'general'} purpose`);
    }
    
    // Get the credential data
    const passkeyData = querySnapshot.docs[0].data() as PasskeyCredential;
    
    console.log("Found valid security key:", passkeyData.deviceName);
    
    // Return the successful authentication with credential details
    return { 
      success: true, 
      verified: true, 
      credentialId: credentialId,
      role: passkeyData.role || 'admin', // Default to admin if not specified
      purpose: passkeyData.purpose || 'general',
      deviceName: passkeyData.deviceName
    };
  } catch (error) {
    console.error('Error authenticating with passkey:', error);
    return { success: false, error };
  }
};

export const getPasskeys = async (): Promise<PasskeyCredential[]> => {
  try {
    // Get all passkeys without filtering by userId
    const q = query(collection(db, "passkeys"));
    const querySnapshot = await getDocs(q);
    
    const credentials: PasskeyCredential[] = [];
    querySnapshot.forEach((doc) => {
      // Don't include deleted passkeys
      if (!doc.data().deleted) {
        credentials.push(doc.data() as PasskeyCredential);
      }
    });
    
    return credentials;
  } catch (error) {
    console.error('Error fetching passkeys:', error);
    return [];
  }
};

export const removePasskey = async (credentialId: string) => {
  try {
    const q = query(collection(db, "passkeys"), where("id", "==", credentialId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Passkey not found' };
    }
    
    const docRef = doc(db, "passkeys", querySnapshot.docs[0].id);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: new Date()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error removing passkey:', error);
    return { success: false, error };
  }
};

function generateChallenge(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}
