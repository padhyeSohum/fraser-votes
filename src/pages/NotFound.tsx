
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 animate-fade-in">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-amber-100 p-4 mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        
        <img 
          src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png" 
          alt="FraserVotes Logo" 
          className="mx-auto h-24 w-auto mb-6" 
        />
        
        <h1 className="text-7xl font-bold text-gray-900 dark:text-white mb-4 font-heading bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg" className="gap-2 button-hover">
            <Link to="/">
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 button-hover">
            <Link to="#" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
