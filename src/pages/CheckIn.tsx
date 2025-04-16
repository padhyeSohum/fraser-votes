
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Search, UserCheck, XCircle } from "lucide-react";
import Header from "@/components/Header";
import { Student } from "@/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CheckIn = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { students, checkInStudent, uncheckStudent } = useElection();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentToUncheck, setStudentToUncheck] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        student => 
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleCheckIn = async (studentId: string) => {
    if (!currentUser) return;
    await checkInStudent(studentId, currentUser.uid);
  };

  const handleUncheckStudent = async () => {
    if (!studentToUncheck || !isSuperAdmin()) return;
    await uncheckStudent(studentToUncheck);
    setStudentToUncheck(null);
  };

  const isSuperAdminUser = isSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Student Check-In</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <UserCheck className="h-5 w-5" />
            <span>
              {students.filter(s => s.checkedIn).length} of {students.length} checked in
            </span>
          </div>
        </div>
        
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name or student ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 font-medium text-gray-600">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">ID</div>
            <div className="col-span-1">Grade</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Action</div>
          </div>
          
          <div className="divide-y max-h-[60vh] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? "No students match your search" : "No students in the system"}
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <div 
                  key={student.id} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center ${student.checkedIn ? 'bg-green-50' : ''}`}
                >
                  <div className="col-span-1 text-gray-500">{index + 1}</div>
                  <div className="col-span-4 font-medium">{student.name}</div>
                  <div className="col-span-2">{student.studentId}</div>
                  <div className="col-span-1">{student.grade}</div>
                  <div className="col-span-2">
                    {student.checkedIn ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Checked In
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    {student.checkedIn ? (
                      isSuperAdminUser ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setStudentToUncheck(student.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Uncheck
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reset the check-in status for {student.name}? This should only be done in exceptional circumstances.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setStudentToUncheck(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleUncheckStudent} className="bg-red-600 hover:bg-red-700">
                                Yes, Uncheck
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                        >
                          Checked In
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleCheckIn(student.id)}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Check-In Instructions</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Verify student identity by checking their school ID card</li>
            <li>Search for the student by name or ID number</li>
            <li>Click the "Check In" button to record their attendance</li>
            <li>Direct the student to the voting area once checked in</li>
            {isSuperAdminUser && (
              <li className="text-red-600">Super admins can reset a student's check-in status if needed</li>
            )}
          </ol>
        </div>
      </main>
    </div>
  );
};

export default CheckIn;
