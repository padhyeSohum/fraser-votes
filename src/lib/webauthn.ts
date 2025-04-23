
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

export const generateChallenge = (): string => {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return arrayBufferToBase64URL(arr.buffer);
};

export const registerSecurityKey = async (userId: string, keyName: string) => {
  try {
    const challenge = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challenge);
    
    const existingCredentials = await getSecurityKeyCredentials(userId);
    const excludeCredentials = existingCredentials.map(cred => ({
      id: cred.id,
      type: 'public-key' as const,
      transports: ['usb', 'ble', 'nfc', 'internal'] as AuthenticatorTransport[]
    }));

    const registrationOptions = {
      challenge,
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

    const registration = await startRegistration(registrationOptions);
    
    const credential: SecurityKeyCredential = {
      id: arrayBufferToBase64URL(registration.rawId),
      publicKey: btoa(JSON.stringify(registration)),
      name: keyName,
      createdAt: new Date(),
      userId
    };

    const keyRef = doc(collection(db, "securityKeys"));
    await setDoc(keyRef, credential);
    
    return { success: true, credential };
  } catch (error) {
    console.error('Error registering security key:', error);
    return { success: false, error };
  }
};

export const authenticateWithSecurityKey = async (userId: string) => {
  try {
    const challenge = generateChallenge();
    sessionStorage.setItem('webauthn_challenge', challenge);
    
    const existingCredentials = await getSecurityKeyCredentials(userId);
    if (existingCredentials.length === 0) {
      throw new Error('No security keys registered for this user');
    }

    const allowCredentials = existingCredentials.map(cred => ({
      id: cred.id,
      type: 'public-key' as const,
      transports: ['usb', 'ble', 'nfc', 'internal'] as AuthenticatorTransport[]
    }));

    const authOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials,
      timeout: 60000,
      userVerification: 'required' as const
    };

    const authentication = await startAuthentication(authOptions);
    
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

export const removeSecurityKey = async (credentialId: string) => {
  try {
    const q = query(collection(db, "securityKeys"), where("id", "==", credentialId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Security key not found' };
    }
    
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

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLToArrayBuffer(base64URLString: string): ArrayBuffer {
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

type AuthenticatorTransport = 'usb' | 'ble' | 'nfc' | 'internal';
