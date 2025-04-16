
// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "superadmin" | "admin" | "staff" | "student" | "guest";
}

// Candidate types
export interface Candidate {
  id: string;
  name: string;
  position: string;
  photoURL: string;
  description?: string;
  votes: number;
}

// Position/Category types
export interface Position {
  id: string;
  title: string;
  description?: string;
  order: number;
}

// Student types
export interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: number;
  checkedIn: boolean;
  checkedInBy?: string;
  checkedInAt?: Date;
  hasVoted: boolean;
}

// Election settings
export interface ElectionSettings {
  isActive: boolean;
  pinCode: string;
  startTime?: Date;
  endTime?: Date;
  title: string;
  description?: string;
  allowMultipleVotes: boolean;
}

// Vote record
export interface Vote {
  id: string;
  candidateId: string;
  position: string;
  timestamp: Date;
  anonymous: boolean;
  studentId?: string;
}
