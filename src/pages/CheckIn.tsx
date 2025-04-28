
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Search, UserCheck, XCircle, Info, CheckSquare } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";

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
  const checkedInCount = students.filter(s => s.checkedIn).length;
  const checkedInPercentage = students.length > 0 ? Math.round((checkedInCount / students.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading mb-1">Student Check-In</h1>
              <p className="text-gray-600 dark:text-gray-400">Verify and record student attendance</p>
            </div>
            
            <div className="flex flex-col items-end w-full md:w-auto">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1 text-sm">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">{checkedInCount} of {students.length} checked in</span>
              </div>
              <div className="w-full md:w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${checkedInPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <Card className="p-4 mb-6 border-0 shadow-md">
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
          
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 dark:bg-gray-700 font-medium text-gray-600 dark:text-gray-300">
              <div className="col-span-1 hidden sm:block">#</div>
              <div className="col-span-4 sm:col-span-3">Name</div>
              <div className="col-span-3 sm:col-span-2">ID</div>
              <div className="col-span-2 sm:col-span-1">Grade</div>
              <div className="col-span-3 sm:col-span-3">Status</div>
              <div className="hidden sm:block sm:col-span-2">Action</div>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
                  <Search className="h-10 w-10 mb-3 text-gray-400" />
                  {searchQuery ? "No students match your search" : "No students in the system"}
                </div>
              ) : (
                filteredStudents.map((student, index) => (
                  <div 
                    key={student.id} 
                    className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${student.checkedIn ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                  >
                    <div className="col-span-1 text-gray-500 hidden sm:block">{index + 1}</div>
                    <div className="col-span-4 sm:col-span-3 font-medium">{student.name}</div>
                    <div className="col-span-3 sm:col-span-2 text-gray-600 dark:text-gray-400">{student.studentId}</div>
                    <div className="col-span-2 sm:col-span-1 text-gray-600 dark:text-gray-400">{student.grade}</div>
                    <div className="col-span-3 sm:col-span-3">
                      {student.checkedIn ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Not Checked In
                        </span>
                      )}
                    </div>
                    <div className="col-span-12 sm:col-span-2 mt-2 sm:mt-0">
                      <div className="sm:hidden border-t border-gray-100 dark:border-gray-700 pt-2 mb-2"></div>
                      {student.checkedIn ? (
                        isSuperAdminUser ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
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
                            className="w-full sm:w-auto"
                          >
                            <CheckSquare className="h-4 w-4 mr-1" />
                            Checked In
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleCheckIn(student.id)}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4 font-heading">Check-In Instructions</h2>
                <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Verify student identity by checking their school ID card</li>
                  <li>Search for the student by name or ID number</li>
                  <li>Click the "Check In" button to record their attendance</li>
                  <li>Direct the student to the voting area once checked in</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckIn;
