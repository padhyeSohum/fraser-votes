
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Mock data to initialize the database
export const initializeMockData = async () => {
  try {
    // Create positions
    const positions = [
      {
        id: "position-president",
        title: "President",
        description: "School President",
        order: 1
      },
      {
        id: "position-vp",
        title: "Vice President",
        description: "School Vice President",
        order: 2
      },
      {
        id: "position-secretary",
        title: "Secretary",
        description: "School Secretary",
        order: 3
      }
    ];

    // Create candidates
    const candidates = [
      {
        id: "candidate-1",
        name: "Alex Johnson",
        position: "position-president",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        description: "Experienced leader with creative ideas",
        votes: 0
      },
      {
        id: "candidate-2",
        name: "Jamie Smith",
        position: "position-president",
        photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
        description: "Focused on improving school events",
        votes: 0
      },
      {
        id: "candidate-3",
        name: "Taylor Williams",
        position: "position-vp",
        photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        description: "Committed to student inclusion",
        votes: 0
      },
      {
        id: "candidate-4",
        name: "Jordan Lee",
        position: "position-vp",
        photoURL: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop",
        description: "Passionate about academic excellence",
        votes: 0
      },
      {
        id: "candidate-5",
        name: "Casey Brown",
        position: "position-secretary",
        photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop",
        description: "Organized and detail-oriented",
        votes: 0
      },
      {
        id: "candidate-6",
        name: "Riley Davis",
        position: "position-secretary",
        photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
        description: "Excellent communication skills",
        votes: 0
      }
    ];

    // Create students
    const students = [
      {
        id: "student-1",
        name: "Morgan Garcia",
        studentId: "123456",
        grade: 12,
        checkedIn: false,
        hasVoted: false
      },
      {
        id: "student-2",
        name: "Dakota Martinez",
        studentId: "123457",
        grade: 11,
        checkedIn: false,
        hasVoted: false
      },
      {
        id: "student-3",
        name: "Quinn Rodriguez",
        studentId: "123458",
        grade: 12,
        checkedIn: false,
        hasVoted: false
      },
      {
        id: "student-4",
        name: "Avery Nguyen",
        studentId: "123459",
        grade: 10,
        checkedIn: false,
        hasVoted: false
      },
      {
        id: "student-5",
        name: "Jordan Wilson",
        studentId: "123460",
        grade: 11,
        checkedIn: false,
        hasVoted: false
      }
    ];

    // Settings
    const settings = {
      id: "election",
      isActive: false,
      pinCode: "1234",
      title: "Student Council Election",
      description: "Vote for your student representatives",
      allowMultipleVotes: false,
      createdAt: serverTimestamp()
    };

    // Add positions
    for (const position of positions) {
      await setDoc(doc(db, "positions", position.id), {
        ...position,
        createdAt: serverTimestamp()
      });
    }

    // Add candidates
    for (const candidate of candidates) {
      await setDoc(doc(db, "candidates", candidate.id), {
        ...candidate,
        createdAt: serverTimestamp()
      });
    }

    // Add students
    for (const student of students) {
      await setDoc(doc(db, "students", student.id), {
        ...student,
        createdAt: serverTimestamp()
      });
    }

    // Add settings
    await setDoc(doc(db, "settings", "election"), settings);

    console.log("Mock data initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing mock data:", error);
    return false;
  }
};
