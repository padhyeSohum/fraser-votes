
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, CollectionReference, DocumentData, collection } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyDqYEdS6IFCMjnNQGr_6ivEY0G0eVQj-Kg",
  authDomain: "fraservotes.firebaseapp.com",
  projectId: "fraservotes",
  storageBucket: "fraservotes.firebasestorage.app",
  messagingSenderId: "589738661664",
  appId: "1:589738661664:web:0991a6afe1427df5e2e945",
  measurementId: "G-WTJQHRQ777"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Helper function to add types to Firestore collections
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Create typed collections
const securityKeysCollection = createCollection<{
  id: string;
  publicKey: string;
  name: string;
  userId: string;
  createdAt: any;
}>("securityKeys");

export { app, auth, db, analytics, securityKeysCollection };
