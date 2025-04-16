
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

// Define the shape of our user data
interface UserData {
  email: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
  displayName?: string;
  photoURL?: string;
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
  const { toast } = useToast();

  // Function to fetch user data from Firestore
  const fetchUserData = async (user: User) => {
    try {
      // Create a fallback user data object in case of errors
      const fallbackUserData: UserData = {
        email: user.email || "",
        role: user.email === "909957@pdsb.net" ? "superadmin" : "guest",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      };
      
      // Try to fetch from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User exists in database
        setUserData(userSnap.data() as UserData);
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
      
      // Create a temporary user data object with basic information
      const fallbackUserData: UserData = {
        email: user.email || "",
        role: user.email === "909957@pdsb.net" ? "superadmin" : "guest",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      };
      
      setUserData(fallbackUserData);
      
      if (error.code === "permission-denied") {
        toast({
          title: "Limited Access Mode",
          description: "Firebase permissions are restricted. Using fallback user data.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Data Access Error",
          description: "Failed to fetch user data. Using fallback settings.",
          variant: "destructive",
        });
      }
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

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    logout,
    isAdmin,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
