import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Candidate, Position, Student, ElectionSettings, Vote } from "@/types";
import { v4 as uuidv4 } from 'uuid';

interface ElectionContextType {
  candidates: Candidate[];
  positions: Position[];
  students: Student[];
  settings: ElectionSettings;
  loading: boolean;
  error: string | null;
  
  // Candidate methods
  addCandidate: (candidate: Omit<Candidate, "id" | "votes">) => Promise<void>;
  updateCandidate: (id: string, candidate: Partial<Omit<Candidate, "id" | "votes">>) => Promise<void>;
  removeCandidate: (id: string) => Promise<void>;
  
  // Position methods
  addPosition: (position: Omit<Position, "id">) => Promise<void>;
  updatePosition: (id: string, position: Partial<Omit<Position, "id">>) => Promise<void>;
  removePosition: (id: string) => Promise<void>;
  
  // Student methods
  addStudent: (student: Omit<Student, "id" | "checkedIn" | "hasVoted">) => Promise<void>;
  addStudents: (students: Omit<Student, "id" | "checkedIn" | "checkedInBy" | "checkedInAt" | "hasVoted">[]) => Promise<void>;
  updateStudent: (id: string, student: Partial<Omit<Student, "id">>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  checkInStudent: (id: string, checkedInBy: string) => Promise<void>;
  uncheckStudent: (id: string) => Promise<void>;
  
  // Settings methods
  updateSettings: (settings: Partial<ElectionSettings>) => Promise<void>;
  startElection: () => Promise<void>;
  endElection: () => Promise<void>;
  
  // Voting methods
  submitVote: (votes: Omit<Vote, "id" | "timestamp">[]) => Promise<void>;
  getResults: () => Promise<Record<string, Candidate[]>>;
  
  // Reset election method
  resetElection: (password: string) => Promise<void>;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error("useElection must be used within an ElectionProvider");
  }
  return context;
};

const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<ElectionSettings>({
    isActive: false,
    pinCode: "1234", // Default pin
    title: "School Election",
    allowMultipleVotes: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribers: (() => void)[] = [];
    
    const setupFirebaseListeners = async () => {
      try {
        const candidatesQuery = query(collection(db, "candidates"), orderBy("position", "asc"));
        const candidatesUnsubscribe = onSnapshot(candidatesQuery, (snapshot) => {
          const candidatesList: Candidate[] = [];
          snapshot.forEach((doc) => {
            candidatesList.push({ id: doc.id, ...doc.data() } as Candidate);
          });
          setCandidates(candidatesList);
          saveToLocalStorage('candidates', candidatesList);
        });
        unsubscribers.push(candidatesUnsubscribe);
        
        const positionsQuery = query(collection(db, "positions"), orderBy("order", "asc"));
        const positionsUnsubscribe = onSnapshot(positionsQuery, (snapshot) => {
          const positionsList: Position[] = [];
          snapshot.forEach((doc) => {
            positionsList.push({ id: doc.id, ...doc.data() } as Position);
          });
          setPositions(positionsList);
          saveToLocalStorage('positions', positionsList);
        });
        unsubscribers.push(positionsUnsubscribe);
        
        const studentsQuery = query(collection(db, "students"), orderBy("name", "asc"));
        const studentsUnsubscribe = onSnapshot(studentsQuery, (snapshot) => {
          const studentsList: Student[] = [];
          snapshot.forEach((doc) => {
            studentsList.push({ id: doc.id, ...doc.data() } as Student);
          });
          setStudents(studentsList);
          saveToLocalStorage('students', studentsList);
        });
        unsubscribers.push(studentsUnsubscribe);
        
        const settingsUnsubscribe = onSnapshot(doc(db, "settings", "election"), (doc) => {
          if (doc.exists()) {
            const settingsData = doc.data() as ElectionSettings;
            setSettings(settingsData);
            saveToLocalStorage('settings', settingsData);
          }
        });
        unsubscribers.push(settingsUnsubscribe);
        
        setLoading(false);
      } catch (err: any) {
        console.error("Error setting up Firebase listeners:", err);
        
        if (err.code === "permission-denied") {
          setOfflineMode(true);
          const storedCandidates = getFromLocalStorage<Candidate[]>('candidates', []);
          const storedPositions = getFromLocalStorage<Position[]>('positions', []);
          const storedStudents = getFromLocalStorage<Student[]>('students', []);
          const storedSettings = getFromLocalStorage<ElectionSettings>('settings', settings);
          
          setCandidates(storedCandidates);
          setPositions(storedPositions);
          setStudents(storedStudents);
          setSettings(storedSettings);
          
          toast({
            title: "Limited Access Mode",
            description: "Firebase permissions are restricted. Using local storage for data persistence.",
            variant: "destructive",
          });
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    };

    setupFirebaseListeners();
    
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [toast]);

  const addCandidate = async (candidate: Omit<Candidate, "id" | "votes">) => {
    try {
      if (offlineMode) {
        const newCandidate: Candidate = {
          ...candidate,
          id: uuidv4(),
          votes: 0
        };
        const updatedCandidates = [...candidates, newCandidate];
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Success (Offline Mode)",
          description: `Added candidate ${candidate.name}`,
        });
        return;
      }
      
      const candidateRef = doc(collection(db, "candidates"));
      await setDoc(candidateRef, {
        ...candidate,
        votes: 0,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: `Added candidate ${candidate.name}`,
      });
    } catch (err: any) {
      console.error("Error adding candidate:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const newCandidate: Candidate = {
          ...candidate,
          id: uuidv4(),
          votes: 0
        };
        const updatedCandidates = [...candidates, newCandidate];
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Limited Access Mode",
          description: `Added candidate ${candidate.name} (local only)`,
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to add candidate: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const updateCandidate = async (id: string, candidate: Partial<Omit<Candidate, "id" | "votes">>) => {
    try {
      if (offlineMode) {
        const updatedCandidates = candidates.map(c => 
          c.id === id ? { ...c, ...candidate } : c
        );
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Candidate updated successfully",
        });
        return;
      }
      
      const candidateRef = doc(db, "candidates", id);
      await updateDoc(candidateRef, {
        ...candidate,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Candidate updated successfully",
      });
    } catch (err: any) {
      console.error("Error updating candidate:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedCandidates = candidates.map(c => 
          c.id === id ? { ...c, ...candidate } : c
        );
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Limited Access Mode",
          description: "Candidate updated successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to update candidate: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const removeCandidate = async (id: string) => {
    try {
      if (offlineMode) {
        const updatedCandidates = candidates.filter(c => c.id !== id);
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Candidate removed successfully",
        });
        return;
      }
      
      const candidateRef = doc(db, "candidates", id);
      await updateDoc(candidateRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Candidate removed successfully",
      });
    } catch (err: any) {
      console.error("Error removing candidate:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedCandidates = candidates.filter(c => c.id !== id);
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        toast({
          title: "Limited Access Mode",
          description: "Candidate removed successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to remove candidate: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const addPosition = async (position: Omit<Position, "id">) => {
    try {
      if (offlineMode) {
        const newPosition: Position = {
          ...position,
          id: uuidv4()
        };
        const updatedPositions = [...positions, newPosition];
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Success (Offline Mode)",
          description: `Added position ${position.title}`,
        });
        return;
      }
      
      const positionRef = doc(collection(db, "positions"));
      await setDoc(positionRef, {
        ...position,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: `Added position ${position.title}`,
      });
    } catch (err: any) {
      console.error("Error adding position:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const newPosition: Position = {
          ...position,
          id: uuidv4()
        };
        const updatedPositions = [...positions, newPosition];
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Limited Access Mode",
          description: `Added position ${position.title} (local only)`,
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to add position: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const updatePosition = async (id: string, position: Partial<Omit<Position, "id">>) => {
    try {
      if (offlineMode) {
        const updatedPositions = positions.map(p => 
          p.id === id ? { ...p, ...position } : p
        );
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Position updated successfully",
        });
        return;
      }
      
      const positionRef = doc(db, "positions", id);
      await updateDoc(positionRef, {
        ...position,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Position updated successfully",
      });
    } catch (err: any) {
      console.error("Error updating position:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedPositions = positions.map(p => 
          p.id === id ? { ...p, ...position } : p
        );
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Limited Access Mode",
          description: "Position updated successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to update position: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const removePosition = async (id: string) => {
    try {
      if (offlineMode) {
        const updatedPositions = positions.filter(p => p.id !== id);
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Position removed successfully",
        });
        return;
      }
      
      const positionRef = doc(db, "positions", id);
      await updateDoc(positionRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Position removed successfully",
      });
    } catch (err: any) {
      console.error("Error removing position:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedPositions = positions.filter(p => p.id !== id);
        setPositions(updatedPositions);
        saveToLocalStorage('positions', updatedPositions);
        
        toast({
          title: "Limited Access Mode",
          description: "Position removed successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to remove position: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const addStudent = async (student: Omit<Student, "id" | "checkedIn" | "hasVoted">) => {
    try {
      if (offlineMode) {
        const newStudent: Student = {
          ...student,
          id: uuidv4(),
          checkedIn: false,
          hasVoted: false
        };
        const updatedStudents = [...students, newStudent];
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: `Added student ${student.name}`,
        });
        return;
      }
      
      const studentRef = doc(collection(db, "students"));
      await setDoc(studentRef, {
        ...student,
        checkedIn: false,
        hasVoted: false,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: `Added student ${student.name}`,
      });
    } catch (err: any) {
      console.error("Error adding student:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const newStudent: Student = {
          ...student,
          id: uuidv4(),
          checkedIn: false,
          hasVoted: false
        };
        const updatedStudents = [...students, newStudent];
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: `Added student ${student.name} (local only)`,
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to add student: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const addStudents = async (studentsToAdd: Omit<Student, "id" | "checkedIn" | "checkedInBy" | "checkedInAt" | "hasVoted">[]) => {
    try {
      if (offlineMode) {
        const newStudents = studentsToAdd.map(student => ({
          ...student,
          id: uuidv4(),
          checkedIn: false,
          hasVoted: false
        }));
        
        const updatedStudents = [...students, ...newStudents];
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: `Added ${studentsToAdd.length} students`,
        });
        return;
      }
      
      const batch = [];
      for (const student of studentsToAdd) {
        const studentRef = doc(collection(db, "students"));
        const studentData = {
          ...student,
          checkedIn: false,
          hasVoted: false,
          createdAt: serverTimestamp()
        };
        
        batch.push(setDoc(studentRef, studentData));
      }
      
      await Promise.all(batch);
      
      toast({
        title: "Success",
        description: `Added ${studentsToAdd.length} students`,
      });
    } catch (err: any) {
      console.error("Error adding students:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        
        const newStudents = studentsToAdd.map(student => ({
          ...student,
          id: uuidv4(),
          checkedIn: false,
          hasVoted: false
        }));
        
        const updatedStudents = [...students, ...newStudents];
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: `Added ${studentsToAdd.length} students (local only)`,
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to add students: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const updateStudent = async (id: string, student: Partial<Omit<Student, "id">>) => {
    try {
      if (offlineMode) {
        const updatedStudents = students.map(s => 
          s.id === id ? { ...s, ...student } : s
        );
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Student updated successfully",
        });
        return;
      }
      
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        ...student,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    } catch (err: any) {
      console.error("Error updating student:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedStudents = students.map(s => 
          s.id === id ? { ...s, ...student } : s
        );
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: "Student updated successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to update student: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const removeStudent = async (id: string) => {
    try {
      if (offlineMode) {
        const updatedStudents = students.filter(s => s.id !== id);
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Student removed successfully",
        });
        return;
      }
      
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Student removed successfully",
      });
    } catch (err: any) {
      console.error("Error removing student:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedStudents = students.filter(s => s.id !== id);
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: "Student removed successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to remove student: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const checkInStudent = async (id: string, checkedInBy: string) => {
    try {
      if (offlineMode) {
        const studentIndex = students.findIndex(s => s.id === id);
        
        if (studentIndex === -1) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
          return;
        }
        
        if (students[studentIndex].checkedIn) {
          toast({
            title: "Warning",
            description: "This student is already checked in",
            variant: "destructive",
          });
          return;
        }
        
        const updatedStudents = [...students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          checkedIn: true,
          checkedInBy,
          checkedInAt: new Date()
        };
        
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Student checked in successfully",
        });
        return;
      }
      
      const studentRef = doc(db, "students", id);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        
        if (studentData.checkedIn) {
          toast({
            title: "Warning",
            description: "This student is already checked in",
            variant: "destructive",
          });
          return;
        }
        
        await updateDoc(studentRef, {
          checkedIn: true,
          checkedInBy,
          checkedInAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Success",
          description: "Student checked in successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Student not found",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error checking in student:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        
        const studentIndex = students.findIndex(s => s.id === id);
        
        if (studentIndex === -1) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
          return;
        }
        
        if (students[studentIndex].checkedIn) {
          toast({
            title: "Warning",
            description: "This student is already checked in",
            variant: "destructive",
          });
          return;
        }
        
        const updatedStudents = [...students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          checkedIn: true,
          checkedInBy,
          checkedInAt: new Date()
        };
        
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: "Student checked in successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to check in student: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const uncheckStudent = async (id: string) => {
    try {
      if (offlineMode) {
        const studentIndex = students.findIndex(s => s.id === id);
        
        if (studentIndex === -1) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
          return;
        }
        
        if (!students[studentIndex].checkedIn) {
          toast({
            title: "Warning",
            description: "This student is not checked in",
            variant: "destructive",
          });
          return;
        }
        
        const updatedStudents = [...students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          checkedIn: false,
          checkedInBy: undefined,
          checkedInAt: undefined
        };
        
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Student check-in status has been reset",
        });
        return;
      }
      
      const studentRef = doc(db, "students", id);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        
        if (!studentData.checkedIn) {
          toast({
            title: "Warning",
            description: "This student is not checked in",
            variant: "destructive",
          });
          return;
        }
        
        await updateDoc(studentRef, {
          checkedIn: false,
          checkedInBy: null,
          checkedInAt: null,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Success",
          description: "Student check-in status has been reset",
        });
      } else {
        toast({
          title: "Error",
          description: "Student not found",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error unchecking student:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        
        const studentIndex = students.findIndex(s => s.id === id);
        
        if (studentIndex === -1) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
          return;
        }
        
        if (!students[studentIndex].checkedIn) {
          toast({
            title: "Warning",
            description: "This student is not checked in",
            variant: "destructive",
          });
          return;
        }
        
        const updatedStudents = [...students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          checkedIn: false,
          checkedInBy: undefined,
          checkedInAt: undefined
        };
        
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
        
        toast({
          title: "Limited Access Mode",
          description: "Student check-in status has been reset (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to reset student check-in: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const updateSettings = async (newSettings: Partial<ElectionSettings>) => {
    try {
      if (offlineMode) {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Election settings updated successfully",
        });
        return;
      }
      
      const settingsRef = doc(db, "settings", "election");
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, {
          ...newSettings,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(settingsRef, {
          ...settings,
          ...newSettings,
          createdAt: serverTimestamp()
        });
      }
      
      toast({
        title: "Success",
        description: "Election settings updated successfully",
      });
    } catch (err: any) {
      console.error("Error updating election settings:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Limited Access Mode",
          description: "Election settings updated successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to update election settings: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const startElection = async () => {
    try {
      if (offlineMode) {
        const updatedSettings = { 
          ...settings, 
          isActive: true,
          startTime: new Date()
        };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Election started successfully",
        });
        return;
      }
      
      const settingsRef = doc(db, "settings", "election");
      await updateDoc(settingsRef, {
        isActive: true,
        startTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Election started successfully",
      });
    } catch (err: any) {
      console.error("Error starting election:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedSettings = { 
          ...settings, 
          isActive: true,
          startTime: new Date()
        };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Limited Access Mode",
          description: "Election started successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to start election: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const endElection = async () => {
    try {
      if (offlineMode) {
        const updatedSettings = { 
          ...settings, 
          isActive: false,
          endTime: new Date()
        };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Election ended successfully",
        });
        return;
      }
      
      const settingsRef = doc(db, "settings", "election");
      await updateDoc(settingsRef, {
        isActive: false,
        endTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Election ended successfully",
      });
    } catch (err: any) {
      console.error("Error ending election:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        const updatedSettings = { 
          ...settings, 
          isActive: false,
          endTime: new Date()
        };
        setSettings(updatedSettings);
        saveToLocalStorage('settings', updatedSettings);
        
        toast({
          title: "Limited Access Mode",
          description: "Election ended successfully (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to end election: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const submitVote = async (votes: Omit<Vote, "id" | "timestamp">[]) => {
    try {
      if (offlineMode) {
        const updatedCandidates = [...candidates];
        
        for (const vote of votes) {
          const candidateIndex = updatedCandidates.findIndex(c => c.id === vote.candidateId);
          if (candidateIndex !== -1) {
            updatedCandidates[candidateIndex] = {
              ...updatedCandidates[candidateIndex],
              votes: updatedCandidates[candidateIndex].votes + 1
            };
          }
        }
        
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        if (votes.length > 0 && votes[0].studentId) {
          const studentId = votes[0].studentId;
          const updatedStudents = students.map(student => 
            student.studentId === studentId 
              ? { ...student, hasVoted: true, votedAt: new Date() } 
              : student
          );
          
          setStudents(updatedStudents);
          saveToLocalStorage('students', updatedStudents);
        }
        
        toast({
          title: "Success (Offline Mode)",
          description: "Your vote has been recorded successfully",
        });
        return;
      }
      
      for (const vote of votes) {
        const voteRef = doc(collection(db, "votes"));
        await setDoc(voteRef, {
          ...vote,
          timestamp: serverTimestamp()
        });
        
        const candidateRef = doc(db, "candidates", vote.candidateId);
        await updateDoc(candidateRef, {
          votes: increment(1),
          updatedAt: serverTimestamp()
        });
      }
      
      if (votes.length > 0 && votes[0].studentId) {
        const studentId = votes[0].studentId;
        const studentsRef = collection(db, "students");
        const studentQuery = query(studentsRef, where("studentId", "==", studentId));
        const studentSnapshot = await getDocs(studentQuery);
        
        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          await updateDoc(doc(db, "students", studentDoc.id), {
            hasVoted: true,
            votedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      
      toast({
        title: "Success",
        description: "Your vote has been recorded successfully",
      });
    } catch (err: any) {
      console.error("Error submitting vote:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        
        const updatedCandidates = [...candidates];
        
        for (const vote of votes) {
          const candidateIndex = updatedCandidates.findIndex(c => c.id === vote.candidateId);
          if (candidateIndex !== -1) {
            updatedCandidates[candidateIndex] = {
              ...updatedCandidates[candidateIndex],
              votes: updatedCandidates[candidateIndex].votes + 1
            };
          }
        }
        
        setCandidates(updatedCandidates);
        saveToLocalStorage('candidates', updatedCandidates);
        
        if (votes.length > 0 && votes[0].studentId) {
          const studentId = votes[0].studentId;
          const updatedStudents = students.map(student => 
            student.studentId === studentId 
              ? { ...student, hasVoted: true, votedAt: new Date() } 
              : student
          );
          
          setStudents(updatedStudents);
          saveToLocalStorage('students', updatedStudents);
        }
        
        toast({
          title: "Limited Access Mode",
          description: "Your vote has been recorded successfully (local only)",
        });
        return;
      }
      
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to submit vote: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const getResults = async () => {
    try {
      if (offlineMode) {
        const results: Record<string, Candidate[]> = {};
        
        candidates.forEach(candidate => {
          if (!results[candidate.position]) {
            results[candidate.position] = [];
          }
          
          results[candidate.position].push(candidate);
        });
        
        Object.keys(results).forEach(position => {
          results[position].sort((a, b) => b.votes - a.votes);
        });
        
        return results;
      }
      
      const candidatesQuery = query(collection(db, "candidates"), orderBy("position", "asc"));
      const candidatesSnapshot = await getDocs(candidatesQuery);
      
      const results: Record<string, Candidate[]> = {};
      
      candidatesSnapshot.forEach((doc) => {
        const candidate = { id: doc.id, ...doc.data() } as Candidate;
        
        if (!results[candidate.position]) {
          results[candidate.position] = [];
        }
        
        results[candidate.position].push(candidate);
      });
      
      Object.keys(results).forEach((position) => {
        results[position].sort((a, b) => b.votes - a.votes);
      });
      
      return results;
    } catch (err: any) {
      console.error("Error getting results:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        
        const results: Record<string, Candidate[]> = {};
        
        candidates.forEach(candidate => {
          if (!results[candidate.position]) {
            results[candidate.position] = [];
          }
          
          results[candidate.position].push(candidate);
        });
        
        Object.keys(results).forEach(position => {
          results[position].sort((a, b) => b.votes - a.votes);
        });
        
        return results;
      }
      
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to get results: ${err.message}`,
        variant: "destructive",
      });
      return {};
    }
  };

  const resetElection = async (password: string) => {
    try {
      if (password !== "akshatmygoat") {
        toast({
          title: "Error",
          description: "Invalid reset password",
          variant: "destructive",
        });
        return;
      }

      if (offlineMode) {
        setCandidates([]);
        setPositions([]);
        const resetStudents = students.map(student => ({
          ...student,
          checkedIn: false,
          checkedInBy: undefined,
          checkedInAt: undefined,
          hasVoted: false,
          votedAt: undefined
        }));
        setStudents(resetStudents);
        
        saveToLocalStorage('candidates', []);
        saveToLocalStorage('positions', []);
        saveToLocalStorage('students', resetStudents);
        
        toast({
          title: "Success (Offline Mode)",
          description: "Election data has been reset",
        });
        return;
      }

      // Delete all candidates
      const candidatesSnapshot = await getDocs(collection(db, "candidates"));
      const candidatePromises = candidatesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { deleted: true, deletedAt: serverTimestamp() })
      );
      await Promise.all(candidatePromises);

      // Delete all positions
      const positionsSnapshot = await getDocs(collection(db, "positions"));
      const positionPromises = positionsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { deleted: true, deletedAt: serverTimestamp() })
      );
      await Promise.all(positionPromises);

      // Reset all students
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentPromises = studentsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          checkedIn: false,
          checkedInBy: null,
          checkedInAt: null,
          hasVoted: false,
          votedAt: null,
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(studentPromises);

      toast({
        title: "Success",
        description: "Election data has been reset",
      });
    } catch (err: any) {
      console.error("Error resetting election:", err);
      
      if (err.code === "permission-denied") {
        setOfflineMode(true);
        setCandidates([]);
        setPositions([]);
        const resetStudents = students.map(student => ({
          ...student,
          checkedIn: false,
          checkedInBy: undefined,
          checkedInAt: undefined,
          hasVoted: false,
          votedAt: undefined
        }));
        setStudents(resetStudents);
        
        saveToLocalStorage('candidates', []);
        saveToLocalStorage('positions', []);
        saveToLocalStorage('students', resetStudents);
        
        toast({
          title: "Limited Access Mode",
          description: "Election data has been reset (local only)",
        });
      } else {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to reset election: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const value: ElectionContextType = {
    candidates,
    positions,
    students,
    settings,
    loading,
    error,
    addCandidate,
    updateCandidate,
    removeCandidate,
    addPosition,
    updatePosition,
    removePosition,
    addStudent,
    addStudents,
    updateStudent,
    removeStudent,
    checkInStudent,
    uncheckStudent,
    updateSettings,
    startElection,
    endElection,
    submitVote,
    getResults,
    resetElection,
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
};
