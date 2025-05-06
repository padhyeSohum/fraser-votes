
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <img 
          src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" 
          alt="FraserVotes Logo" 
          className="mx-auto h-20 w-auto mb-8" 
        />
        
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <p className="text-sm">
                You do not have access to this page, please contact Aleena, Cody, or Akshat if you believe this is an error.
              </p>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg" className="btn-primary">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="border-gray-200 hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
