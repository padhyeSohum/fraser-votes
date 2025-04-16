
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, db, storage, analytics };
