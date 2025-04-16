
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, AlertCircle, Trash, UserCheck } from "lucide-react";
import { Student } from "@/types";
import { parseStudentCSV } from "@/utils/csvParser";
import { useElection } from "@/contexts/ElectionContext";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudentManagement = () => {
  const { students, addStudents, removeStudent } = useElection();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<Omit<Student, "id" | "checkedIn" | "checkedInBy" | "checkedInAt" | "hasVoted">[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setUploadPreview([]);
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    // Preview the CSV contents
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedStudents = parseStudentCSV(csvText);
        setUploadPreview(parsedStudents);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    reader.readAsText(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file || uploadPreview.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Add students to the system
      await addStudents(uploadPreview);
      
      // Reset the form
      setFile(null);
      setUploadPreview([]);
      
      // Show success message
      toast({
        title: "Students Uploaded",
        description: `Successfully added ${uploadPreview.length} students to the system.`,
        duration: 3000,
      });
      
      // Reset the file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Student Data</CardTitle>
          <CardDescription>
            Import student names, IDs, and grades from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-upload">CSV File</Label>
              <Input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500">
                CSV must include columns: Name, StudentID, Grade
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {uploadPreview.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Preview ({uploadPreview.length} students)</h3>
                <ScrollArea className="h-40 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadPreview.slice(0, 5).map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                        </TableRow>
                      ))}
                      {uploadPreview.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                            ...and {uploadPreview.length - 5} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : `Upload ${uploadPreview.length} Students`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Students</CardTitle>
          <CardDescription>
            View and manage all students in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No students in the system yet. Upload a CSV to add students.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span 
                            className={`mr-2 h-2 w-2 rounded-full ${
                              student.checkedIn ? 'bg-green-500' : 'bg-gray-300'
                            }`} 
                          />
                          <span className="text-sm">
                            {student.checkedIn ? 'Checked In' : 'Not Checked In'}
                          </span>
                          {student.hasVoted && (
                            <span className="ml-2 text-xs text-blue-500 flex items-center">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Voted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeStudent(student.id)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;
