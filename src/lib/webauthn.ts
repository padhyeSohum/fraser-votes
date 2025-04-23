
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  userHandle: string;
  createdAt: any;
  userId: string;
  deviceName?: string;
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
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const registerPasskey = async (userId: string, deviceName?: string) => {
  try {
    const challenge = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challenge);
    
    const registrationOptions = {
      challenge,
      rp: {
        name: 'FraserVotes',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: userId,
        displayName: deviceName || 'FraserVotes Passkey'
      },
      pubKeyCredParams: [
        { type: 'public-key' as const, alg: -7 },   // ES256
        { type: 'public-key' as const, alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform" as const,
        requireResidentKey: true,
        residentKey: "required" as const,
        userVerification: "required" as const
      },
      timeout: 60000,
      attestation: 'none' as const
    };

    const registration = await startRegistration(registrationOptions);
    
    const credential: PasskeyCredential = {
      id: arrayBufferToBase64(registration.rawId),
      publicKey: btoa(JSON.stringify(registration)),
      userHandle: userId,
      createdAt: new Date(),
      userId,
      deviceName
    };

    const keyRef = doc(collection(db, "passkeys"));
    await setDoc(keyRef, credential);
    
    return { success: true, credential };
  } catch (error) {
    console.error('Error registering passkey:', error);
    return { success: false, error };
  }
};

export const authenticateWithPasskey = async (userId: string) => {
  try {
    const challenge = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challenge);

    const authOptions = {
      challenge,
      rpId: window.location.hostname,
      timeout: 60000,
      userVerification: 'required' as const
    };

    const authentication = await startAuthentication(authOptions);
    const credentialIdBase64 = arrayBufferToBase64(authentication.rawId);
    
    const q = query(collection(db, "passkeys"), where("id", "==", credentialIdBase64));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Unknown passkey');
    }
    
    return { success: true, verified: true };
  } catch (error) {
    console.error('Error authenticating with passkey:', error);
    return { success: false, error };
  }
};

export const getPasskeys = async (userId: string): Promise<PasskeyCredential[]> => {
  try {
    const q = query(collection(db, "passkeys"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const credentials: PasskeyCredential[] = [];
    querySnapshot.forEach((doc) => {
      credentials.push(doc.data() as PasskeyCredential);
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
  return btoa(String.fromCharCode(...array));
}
