import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest" | "checkin" | "vote";
  assignedPinId?: string | null;
  lastLogin?: Date;
}

interface AuthContextProps {
  currentUser: any;
  userData: UserData | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canAccessCheckin: () => boolean;
  canAccessVote: () => boolean;
  authorizedUsers: UserData[];
  addAuthorizedUser: (user: Omit<UserData, 'id' | 'lastLogin'>) => Promise<void>;
  removeAuthorizedUser: (id: string) => Promise<void>;
  updateUserRole: (id: string, role: UserData['role']) => Promise<void>;
  fetchAuthorizedUsers: () => Promise<void>;
  updateUserWithPin: (userId: string, pinId: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  userData: null,
  loading: true,
  error: '',
  login: async () => {},
  logout: async () => {},
  isAdmin: () => false,
  isSuperAdmin: () => false,
  canAccessCheckin: () => false,
  canAccessVote: () => false,
  authorizedUsers: [],
  addAuthorizedUser: async () => {},
  removeAuthorizedUser: async () => {},
  updateUserRole: async () => {},
  fetchAuthorizedUsers: async () => {},
  updateUserWithPin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchAuthorizedUsers();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError('');
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(user.uid);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
      setUserData(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const isAdmin = () => {
    return userData?.role === 'admin' || userData?.role === 'superadmin';
  };

  const isSuperAdmin = () => {
    return userData?.role === 'superadmin';
  };

  const canAccessCheckin = () => {
    return userData?.role === 'checkin' || userData?.role === 'admin' || userData?.role === 'superadmin';
  };

  const canAccessVote = () => {
    return userData?.role === 'vote' || userData?.role === 'admin' || userData?.role === 'superadmin';
  };

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        setUserData(null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addAuthorizedUser = async (user: Omit<UserData, 'id' | 'lastLogin'>) => {
    try {
      setError('');
      const userRef = doc(db, 'users', user.email.replace('@pdsb.net', ''));
      await setDoc(userRef, { ...user, id: user.email.replace('@pdsb.net', '') });
      await fetchAuthorizedUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const removeAuthorizedUser = async (id: string) => {
    try {
      setError('');
      // const userRef = doc(db, 'users', id);
      // await deleteDoc(userRef);
      
      const userRef = doc(db, 'users', id.replace('@pdsb.net', ''));
      await updateDoc(userRef, {
        role: 'guest'
      });
      
      await fetchAuthorizedUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateUserRole = async (id: string, role: UserData['role']) => {
    try {
      setError('');
      const userRef = doc(db, 'users', id.replace('@pdsb.net', ''));
      await updateDoc(userRef, { role: role });
      await fetchAuthorizedUsers();
      if (currentUser?.uid === id) {
        await fetchUserData(currentUser.uid);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchAuthorizedUsers = async () => {
    try {
      setError('');
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList: UserData[] = [];
      usersSnapshot.forEach((doc) => {
        usersList.push(doc.data() as UserData);
      });
      setAuthorizedUsers(usersList);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateUserWithPin = async (userId: string, pinId: string | null) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { assignedPinId: pinId });
      return true;
    } catch (error) {
      console.error("Error updating user PIN assignment:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        error,
        login,
        logout,
        isAdmin,
        isSuperAdmin,
        canAccessCheckin,
        canAccessVote,
        authorizedUsers,
        addAuthorizedUser,
        removeAuthorizedUser,
        updateUserRole,
        fetchAuthorizedUsers,
        updateUserWithPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
