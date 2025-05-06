
export interface PinAccess {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
  createdAt: Date;
}

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

export interface Position {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  photoURL?: string;
  description?: string;
  votes?: number;
}

export interface Vote {
  id: string;
  candidateId: string;
  position: string;
  anonymous: boolean;
  studentId?: string;
  timestamp?: Date;
}

export interface ElectionSettings {
  isActive: boolean;
  pinCode: string;
  pins?: PinAccess[];
  title: string;
  allowMultipleVotes: boolean;
  startTime?: Date;
  endTime?: Date;
}
