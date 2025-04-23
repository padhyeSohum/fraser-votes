
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
  createdAt?: Date; // Added createdAt
  updatedAt?: Date; // Added updatedAt
  deleted?: boolean; // Added deleted flag
  deletedAt?: Date; // Added deletedAt
}

// Position/Category types
export interface Position {
  id: string;
  title: string;
  description?: string;
  order: number;
  createdAt?: Date; // Added createdAt
  updatedAt?: Date; // Added updatedAt
  deleted?: boolean; // Added deleted flag
  deletedAt?: Date; // Added deletedAt
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
  votedAt?: Date; // Added votedAt
  createdAt?: Date; // Added createdAt
  updatedAt?: Date; // Added updatedAt
  deleted?: boolean; // Added deleted flag
  deletedAt?: Date; // Added deletedAt
}

// Pin access code
export interface PinAccess {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
  createdAt?: Date;
}

// Election settings
export interface ElectionSettings {
  isActive: boolean;
  pinCode: string;  // Keep for backward compatibility
  startTime?: Date;
  endTime?: Date;
  title: string;
  description?: string;
  allowMultipleVotes: boolean;
  pins?: PinAccess[];  // New field for multiple pins
  createdAt?: Date; // Added createdAt
  updatedAt?: Date; // Added updatedAt
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
