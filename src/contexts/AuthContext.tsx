import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

// Define the shape of our user data
interface UserData {
  email: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
  displayName?: string;
  photoURL?: string;
  createdAt?: any; // Adding createdAt field to interface
  authorized?: boolean; // Adding authorized field to interface
}

// Define the shape of our authorized user
interface AuthorizedUser {
  id: string;
  email: string;
  name?: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
  createdAt?: any;
}

// Define the shape of our context
interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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

  // Function to check if a user is authorized
  const isUserAuthorized = async (email: string): Promise<boolean> => {
    try {
      // Check if it's a superadmin email
      const superadminEmails = ["909957@pdsb.net", "728266@pdsb.net"];
      if (superadminEmails.includes(email)) {
        return true;
      }
      
      // Check if the user exists in the authorized users collection
      const q = query(collection(db, "authorizedUsers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking authorization:", error);
      return false;
    }
  };
  
  // Function to fetch all authorized users
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
  
  // Function to add an authorized user
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
      
      // Refresh the list
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
  
  // Function to remove an authorized user
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
      
      // Refresh the list
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

  // Function to fetch user data from Firestore
  const fetchUserData = async (user: User) => {
    try {
      // Check if the user is authorized
      const authorized = await isUserAuthorized(user.email || "");
      
      if (!authorized) {
        // If not authorized, sign them out
        await signOut(auth);
        toast({
          title: "Access Denied",
          description: "You do not have access to FraserVotes. Please contact an administrator.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a fallback user data object in case of errors
      const fallbackUserData: UserData = {
        email: user.email || "",
        role: user.email === "909957@pdsb.net" ? "superadmin" : "guest",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        authorized: true
      };
      
      // Try to fetch from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User exists in database
        setUserData({
          ...userSnap.data() as UserData,
          authorized: true
        });
        console.log("Found existing user record:", userSnap.data());
      } else {
        // New user - create a record with default role
        try {
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
        } catch (error: any) {
          console.error("Error creating user document:", error);
          // Fall back to local user data
          setUserData(fallbackUserData);
          
          if (error.code === "permission-denied") {
            toast({
              title: "Limited Access Mode",
              description: "Firebase permissions are restricted. Using fallback user data.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Warning",
              description: "Could not save user data to database. Some features may be limited.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      
      // If there's any error, sign the user out for safety
      await signOut(auth);
      setUserData(null);
      
      toast({
        title: "Authentication Error",
        description: "There was a problem verifying your access. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Restrict to @pdsb.net domains
      provider.setCustomParameters({
        hd: "pdsb.net",
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user's email ends with @pdsb.net
      if (!result.user.email?.endsWith("@pdsb.net")) {
        await signOut(auth);
        toast({
          title: "Authentication Failed",
          description: "You must use a @pdsb.net email to sign in.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the user is authorized
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
      
      throw error; // Re-throw for the login component to handle
    }
  };

  // Handle logout
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

  // Check if user is an admin
  const isAdmin = () => {
    return userData?.role === "admin" || userData?.role === "superadmin";
  };

  // Check if user is a superadmin
  const isSuperAdmin = () => {
    return userData?.role === "superadmin";
  };

  // Listen for auth state changes
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

  // Fetch authorized users on initial load
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
