
/**
 * Utility for parsing CSV data and converting to student records
 */

import { Student } from "@/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse CSV data and convert to student records
 * Expected format: Name,StudentID,Grade
 */
export const parseStudentCSV = (csvText: string): Omit<Student, "id" | "checkedIn" | "checkedInBy" | "checkedInAt" | "hasVoted">[] => {
  try {
    // Split the CSV text into lines
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    // Remove any BOM character that might be present
    const firstLine = lines[0].replace(/^\ufeff/, '');
    
    // Get headers (first line)
    const headers = firstLine.split(',').map(header => header.trim().toLowerCase());
    
    // Find required column indices
    const nameIndex = headers.findIndex(h => h === 'name');
    const idIndex = headers.findIndex(h => h === 'studentid' || h === 'student id' || h === 'id');
    const gradeIndex = headers.findIndex(h => h === 'grade');
    
    // Validate required columns exist
    if (nameIndex === -1 || idIndex === -1 || gradeIndex === -1) {
      throw new Error('CSV missing required columns. Headers must include: Name, StudentID, Grade');
    }
    
    // Parse the rest of the lines into student objects
    return lines.slice(1).map(line => {
      const columns = line.split(',').map(col => col.trim());
      
      // Get values from columns
      const name = columns[nameIndex];
      const studentId = columns[idIndex];
      const gradeStr = columns[gradeIndex];
      
      // Convert grade to number
      const grade = parseInt(gradeStr, 10);
      
      // Validate required fields
      if (!name || !studentId || isNaN(grade)) {
        throw new Error(`Invalid student data: ${line}`);
      }
      
      return {
        name,
        studentId,
        grade
      };
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
};
