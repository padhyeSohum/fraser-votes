import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  getAuth,
  signInAnonymously
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  email: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  authorized?: boolean;
}

interface AuthorizedUser {
  id: string;
  email: string;
  name?: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
  createdAt?: any;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPasskey: (userId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  authorizedUsers: AuthorizedUser[];
  fetchAuthorizedUsers: () => Promise<void>;
  addAuthorizedUser: (user: Omit<AuthorizedUser, "id" | "createdAt">) => Promise<void>;
  removeAuthorizedUser: (userId: string) => Promise<void>;
  isUserAuthorized: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const { toast } = useToast();

  const isUserAuthorized = async (email: string): Promise<boolean> => {
    try {
      const superadminEmails = ["909957@pdsb.net", "728266@pdsb.net", "816776@pdsb.net", "p0042314@pdsb.net"];
      if (superadminEmails.includes(email)) {
        return true;
      }
      
      const q = query(collection(db, "authorizedUsers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking authorization:", error);
      return false;
    }
  };

  const fetchAuthorizedUsers = async (): Promise<void> => {
    try {
      const usersCollection = collection(db, "authorizedUsers");
      const usersSnapshot = await getDocs(usersCollection);
      
      const users: AuthorizedUser[] = [];
      usersSnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data() as Omit<AuthorizedUser, "id">
        });
      });
      
      setAuthorizedUsers(users);
    } catch (error) {
      console.error("Error fetching authorized users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch authorized users",
        variant: "destructive",
      });
    }
  };

  const addAuthorizedUser = async (user: Omit<AuthorizedUser, "id" | "createdAt">): Promise<void> => {
    try {
      const usersCollection = collection(db, "authorizedUsers");
      const newUserRef = doc(usersCollection);
      
      await setDoc(newUserRef, {
        ...user,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: `${user.name || user.email} has been authorized`,
      });
      
      await fetchAuthorizedUsers();
    } catch (error) {
      console.error("Error adding authorized user:", error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const removeAuthorizedUser = async (userId: string): Promise<void> => {
    try {
      const userRef = doc(db, "authorizedUsers", userId);
      await setDoc(userRef, { 
        deleted: true,
        deletedAt: serverTimestamp() 
      }, { merge: true });
      
      toast({
        title: "Success",
        description: "User has been removed",
      });
      
      await fetchAuthorizedUsers();
    } catch (error) {
      console.error("Error removing authorized user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const fetchUserData = async (user: User) => {
    try {
      const authorized = await isUserAuthorized(user.email || "");
      
      if (!authorized) {
        await signOut(auth);
        toast({
          title: "Access Denied",
          description: "You do not have access to FraserVotes. Please contact an administrator.",
          variant: "destructive",
        });
        return;
      }
      
      const fallbackUserData: UserData = {
        email: user.email || "",
        role: user.email === "909957@pdsb.net" ? "superadmin" : "guest",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        authorized: true
      };
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserData({
          ...userSnap.data() as UserData,
          authorized: true
        });
        console.log("Found existing user record:", userSnap.data());
      } else {
        const newUserData: UserData = {
          ...fallbackUserData,
          createdAt: serverTimestamp(),
        };
        
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
        console.log("Created new user record:", newUserData);
        toast({
          title: "Account Created",
          description: "Welcome! Your account has been set up.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      
      await signOut(auth);
      setUserData(null);
      
      toast({
        title: "Authentication Error",
        description: "There was a problem verifying your access. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: "pdsb.net",
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user.email?.endsWith("@pdsb.net")) {
        await signOut(auth);
        toast({
          title: "Authentication Failed",
          description: "You must use a @pdsb.net email to sign in.",
          variant: "destructive",
        });
        return;
      }
      
      const isAuthorized = await isUserAuthorized(result.user.email);
      
      if (!isAuthorized) {
        await signOut(auth);
        toast({
          title: "Access Denied",
          description: "You do not have access to FraserVotes. Please contact an administrator.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      let errorMessage = "Failed to sign in with Google";
      
      if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for authentication. Please use the production URL.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signInWithPasskey = async (userId: string): Promise<boolean> => {
    try {
      console.log("Signing in with passkey for user ID:", userId);
      
      const q = query(collection(db, "users"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.error("No user found with the provided userId");
        toast({
          title: "Authentication Failed",
          description: "No user found with this security key",
          variant: "destructive",
        });
        return false;
      }
      
      const userData = querySnapshot.docs[0].data() as UserData;
      
      await signInAnonymously(auth);
      
      console.log("Signed in anonymously, setting user data:", userData);
      
      setUserData({
        ...userData,
        authorized: true
      });
      
      toast({
        title: "Success",
        description: "Signed in with security key",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error signing in with passkey:", error);
      
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to sign in with security key",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const isAdmin = () => {
    return userData?.role === "admin" || userData?.role === "superadmin";
  };

  const isSuperAdmin = () => {
    return userData?.role === "superadmin";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && isAdmin()) {
      fetchAuthorizedUsers();
    }
  }, [currentUser, userData]);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signInWithPasskey,
    logout,
    isAdmin,
    isSuperAdmin,
    authorizedUsers,
    fetchAuthorizedUsers,
    addAuthorizedUser,
    removeAuthorizedUser,
    isUserAuthorized
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
