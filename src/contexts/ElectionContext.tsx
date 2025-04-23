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
  increment,
  limit,
  startAfter
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
  
  // New refresh methods for manual data loading
  refreshData: () => Promise<void>;
  refreshCandidates: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  
  // Pagination methods
  loadMoreStudents: () => Promise<void>;
  hasMoreStudents: boolean;
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

const CACHE_EXPIRY = 5 * 60 * 1000;

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
  
  const [studentsLastDoc, setStudentsLastDoc] = useState<any>(null);
  const [hasMoreStudents, setHasMoreStudents] = useState(false);
  const [studentsPerPage] = useState(50); // Load 50 students at a time
  
  const [lastRefreshTime, setLastRefreshTime] = useState({
    candidates: Date.now(),
    positions: Date.now(),
    students: Date.now(),
    settings: Date.now()
  });

  useEffect(() => {
    const setupInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCandidates(),
          fetchPositions(),
          fetchStudentsBatch(true),
          fetchSettings()
        ]);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading initial data:", err);
        
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

    setupInitialData();
  }, [toast]);

  const fetchCandidates = async () => {
    try {
      const candidatesQuery = query(
        collection(db, "candidates"), 
        orderBy("position", "asc")
      );
      
      const snapshot = await getDocs(candidatesQuery);
      const candidatesList: Candidate[] = [];
      
      snapshot.forEach((doc) => {
        candidatesList.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      
      setCandidates(candidatesList);
      saveToLocalStorage('candidates', candidatesList);
      setLastRefreshTime(prev => ({ ...prev, candidates: Date.now() }));
      return candidatesList;
    } catch (error) {
      console.error("Error fetching candidates:", error);
      throw error;
    }
  };

  const fetchPositions = async () => {
    try {
      const positionsQuery = query(
        collection(db, "positions"), 
        orderBy("order", "asc")
      );
      
      const snapshot = await getDocs(positionsQuery);
      const positionsList: Position[] = [];
      
      snapshot.forEach((doc) => {
        positionsList.push({ id: doc.id, ...doc.data() } as Position);
      });
      
      setPositions(positionsList);
      saveToLocalStorage('positions', positionsList);
      setLastRefreshTime(prev => ({ ...prev, positions: Date.now() }));
      return positionsList;
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw error;
    }
  };

  const fetchStudentsBatch = async (reset: boolean = false) => {
    try {
      let studentsQuery;
      
      if (reset) {
        studentsQuery = query(
          collection(db, "students"),
          orderBy("name", "asc"),
          limit(studentsPerPage)
        );
      } else if (studentsLastDoc) {
        studentsQuery = query(
          collection(db, "students"),
          orderBy("name", "asc"),
          limit(studentsPerPage),
          /* @ts-ignore */
          startAfter(studentsLastDoc)
        );
      } else {
        setHasMoreStudents(false);
        return [];
      }
      
      const snapshot = await getDocs(studentsQuery);
      
      setHasMoreStudents(!snapshot.empty && snapshot.docs.length === studentsPerPage);
      
      if (!snapshot.empty) {
        setStudentsLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setStudentsLastDoc(null);
      }
      
      const studentsList: Student[] = [];
      snapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() } as Student);
      });
      
      if (reset) {
        setStudents(studentsList);
        saveToLocalStorage('students', studentsList);
      } else {
        const updatedStudents = [...students, ...studentsList];
        setStudents(updatedStudents);
        saveToLocalStorage('students', updatedStudents);
      }
      
      setLastRefreshTime(prev => ({ ...prev, students: Date.now() }));
      return studentsList;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  };

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "election"));
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data() as ElectionSettings;
        setSettings(settingsData);
        saveToLocalStorage('settings', settingsData);
        setLastRefreshTime(prev => ({ ...prev, settings: Date.now() }));
        return settingsData;
      }
      
      return settings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  };

  const loadMoreStudents = async () => {
    if (!hasMoreStudents || offlineMode) return;
    
    try {
      await fetchStudentsBatch(false);
    } catch (err: any) {
      console.error("Error loading more students:", err);
      toast({
        title: "Error",
        description: `Failed to load more students: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshCandidates = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data in offline mode",
      });
      return;
    }
    
    try {
      await fetchCandidates();
      toast({
        title: "Success",
        description: "Candidates refreshed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to refresh candidates: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshPositions = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data in offline mode",
      });
      return;
    }
    
    try {
      await fetchPositions();
      toast({
        title: "Success",
        description: "Positions refreshed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to refresh positions: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshStudents = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data in offline mode",
      });
      return;
    }
    
    try {
      await fetchStudentsBatch(true);
      toast({
        title: "Success",
        description: "Students refreshed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to refresh students: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshSettings = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data in offline mode",
      });
      return;
    }
    
    try {
      await fetchSettings();
      toast({
        title: "Success",
        description: "Settings refreshed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to refresh settings: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data in offline mode",
      });
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all([
        fetchCandidates(),
        fetchPositions(),
        fetchStudentsBatch(true),
        fetchSettings()
      ]);
      
      toast({
        title: "Success",
        description: "All data refreshed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to refresh data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      const candidateData = {
        ...candidate,
        votes: 0,
        createdAt: serverTimestamp()
      };
      await setDoc(candidateRef, candidateData);
      
      const newCandidate: Candidate = {
        ...candidate,
        id: candidateRef.id,
        votes: 0
      };
      
      setCandidates(prev => [...prev, newCandidate]);
      saveToLocalStorage('candidates', [...candidates, newCandidate]);
      
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
      
      setCandidates(prev => 
        prev.map(c => c.id === id ? { ...c, ...candidate } : c)
      );
      saveToLocalStorage('candidates', candidates.map(c => 
        c.id === id ? { ...c, ...candidate } : c
      ));
      
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
      const positionData = {
        ...position,
        createdAt: serverTimestamp()
      };
      await setDoc(positionRef, positionData);
      
      const newPosition: Position = {
        ...position,
        id: positionRef.id
      };
      
      setPositions(prev => [...prev, newPosition]);
      saveToLocalStorage('positions', [...positions, newPosition]);
      
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
      const newStudentsWithIds = [];
      
      for (const student of studentsToAdd) {
        const studentRef = doc(collection(db, "students"));
        const studentData = {
          ...student,
          checkedIn: false,
          hasVoted: false,
          createdAt: serverTimestamp()
        };
        
        batch.push(setDoc(studentRef, studentData));
        newStudentsWithIds.push({
          ...student,
          id: studentRef.id,
          checkedIn: false,
          hasVoted: false,
        });
      }
      
      await Promise.all(batch);
      
      setStudents(prev => [...prev, ...newStudentsWithIds]);
      saveToLocalStorage('students', [...students, ...newStudentsWithIds]);
      
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
          return
