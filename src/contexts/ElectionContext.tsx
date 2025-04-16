
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
import { initializeMockData } from "@/lib/mockData";

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
  updateStudent: (id: string, student: Partial<Omit<Student, "id">>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  checkInStudent: (id: string, checkedInBy: string) => Promise<void>;
  
  // Settings methods
  updateSettings: (settings: Partial<ElectionSettings>) => Promise<void>;
  startElection: () => Promise<void>;
  endElection: () => Promise<void>;
  
  // Voting methods
  submitVote: (votes: Omit<Vote, "id" | "timestamp">[]) => Promise<void>;
  getResults: () => Promise<Record<string, Candidate[]>>;
  
  // Database initialization
  initializeData: () => Promise<boolean>;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error("useElection must be used within an ElectionProvider");
  }
  return context;
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
  const { toast } = useToast();

  // Initialize listeners for all collections
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    try {
      // Listen for candidates
      const candidatesQuery = query(collection(db, "candidates"), orderBy("position", "asc"));
      const candidatesUnsubscribe = onSnapshot(candidatesQuery, (snapshot) => {
        const candidatesList: Candidate[] = [];
        snapshot.forEach((doc) => {
          candidatesList.push({ id: doc.id, ...doc.data() } as Candidate);
        });
        setCandidates(candidatesList);
      });
      unsubscribers.push(candidatesUnsubscribe);
      
      // Listen for positions
      const positionsQuery = query(collection(db, "positions"), orderBy("order", "asc"));
      const positionsUnsubscribe = onSnapshot(positionsQuery, (snapshot) => {
        const positionsList: Position[] = [];
        snapshot.forEach((doc) => {
          positionsList.push({ id: doc.id, ...doc.data() } as Position);
        });
        setPositions(positionsList);
      });
      unsubscribers.push(positionsUnsubscribe);
      
      // Listen for students
      const studentsQuery = query(collection(db, "students"), orderBy("name", "asc"));
      const studentsUnsubscribe = onSnapshot(studentsQuery, (snapshot) => {
        const studentsList: Student[] = [];
        snapshot.forEach((doc) => {
          studentsList.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(studentsList);
      });
      unsubscribers.push(studentsUnsubscribe);
      
      // Listen for settings
      const settingsUnsubscribe = onSnapshot(doc(db, "settings", "election"), (doc) => {
        if (doc.exists()) {
          setSettings(doc.data() as ElectionSettings);
        }
      });
      unsubscribers.push(settingsUnsubscribe);
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error setting up listeners:", err);
      setError(err.message);
      setLoading(false);
    }
    
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Candidate methods
  const addCandidate = async (candidate: Omit<Candidate, "id" | "votes">) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to add candidate: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const updateCandidate = async (id: string, candidate: Partial<Omit<Candidate, "id" | "votes">>) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to update candidate: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const removeCandidate = async (id: string) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to remove candidate: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  // Position methods
  const addPosition = async (position: Omit<Position, "id">) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to add position: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const updatePosition = async (id: string, position: Partial<Omit<Position, "id">>) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to update position: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const removePosition = async (id: string) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to remove position: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  // Student methods
  const addStudent = async (student: Omit<Student, "id" | "checkedIn" | "hasVoted">) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to add student: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const updateStudent = async (id: string, student: Partial<Omit<Student, "id">>) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to update student: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const removeStudent = async (id: string) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to remove student: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const checkInStudent = async (id: string, checkedInBy: string) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to check in student: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  // Settings methods
  const updateSettings = async (newSettings: Partial<ElectionSettings>) => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to update election settings: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const startElection = async () => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to start election: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const endElection = async () => {
    try {
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
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to end election: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  // Voting methods
  const submitVote = async (votes: Omit<Vote, "id" | "timestamp">[]) => {
    try {
      // Add each vote to the votes collection
      for (const vote of votes) {
        const voteRef = doc(collection(db, "votes"));
        await setDoc(voteRef, {
          ...vote,
          timestamp: serverTimestamp()
        });
        
        // Update candidate vote count
        const candidateRef = doc(db, "candidates", vote.candidateId);
        await updateDoc(candidateRef, {
          votes: increment(1),
          updatedAt: serverTimestamp()
        });
      }
      
      // If studentId was provided, mark student as having voted
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
      
      // Sort candidates by votes within each position
      Object.keys(results).forEach((position) => {
        results[position].sort((a, b) => b.votes - a.votes);
      });
      
      return results;
    } catch (err: any) {
      console.error("Error getting results:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to get results: ${err.message}`,
        variant: "destructive",
      });
      return {};
    }
  };

  // Function to initialize mock data
  const initializeData = async (): Promise<boolean> => {
    try {
      const result = await initializeMockData();
      if (result) {
        toast({
          title: "Success",
          description: "Demo data initialized successfully",
        });
      }
      return result;
    } catch (err: any) {
      console.error("Error initializing data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to initialize data: ${err.message}`,
        variant: "destructive",
      });
      return false;
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
    updateStudent,
    removeStudent,
    checkInStudent,
    updateSettings,
    startElection,
    endElection,
    submitVote,
    getResults,
    initializeData
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
};
