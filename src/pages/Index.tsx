
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { UserCheck, Vote, CheckCircle } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  const { userData } = useAuth();
  const isAdmin = userData?.role === "admin" || userData?.role === "superadmin";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 font-heading bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to FraserVotes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A secure platform for John Fraser Secondary School student elections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card className="overflow-hidden border-0 shadow-lg card-hover animate-fade-in">
              <div className="h-2 bg-blue-500" />
              <CardContent className="pt-6">
                <div className="rounded-full bg-blue-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check-In</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Verify student identities and record attendance for the voting process.
                </p>
                <Button asChild className="w-full mt-2" variant="outline">
                  <Link to="/checkin">Go to Check-In</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-lg card-hover animate-fade-in [animation-delay:150ms]">
              <div className="h-2 bg-green-500" />
              <CardContent className="pt-6">
                <div className="rounded-full bg-green-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Vote className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Vote</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Cast your vote for the school election candidates securely and easily.
                </p>
                <Button asChild className="w-full mt-2" variant="outline">
                  <Link to="/vote">Go to Voting</Link>
                </Button>
              </CardContent>
            </Card>
            
            {isAdmin && (
              <Card className="overflow-hidden border-0 shadow-lg card-hover animate-fade-in [animation-delay:300ms]">
                <div className="h-2 bg-purple-500" />
                <CardContent className="pt-6">
                  <div className="rounded-full bg-purple-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Administration</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Manage election settings, candidates, positions, and view results.
                  </p>
                  <Button asChild className="w-full mt-2" variant="outline">
                    <Link to="/admin">Admin Panel</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 font-heading">About FraserVotes</h2>
            <p className="text-gray-600 dark:text-gray-300">
              FraserVotes is designed to streamline the student election process at John Fraser Secondary School. 
              Our platform ensures secure, transparent, and efficient voting while making it easy for election 
              administrators to manage the entire process.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4">
                <div className="text-2xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-gray-500 text-center">Secure Voting</div>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="text-2xl font-bold text-primary mb-1">Fast</div>
                <div className="text-sm text-gray-500 text-center">Result Processing</div>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="text-2xl font-bold text-primary mb-1">Easy</div>
                <div className="text-sm text-gray-500 text-center">To Use Interface</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Index;
