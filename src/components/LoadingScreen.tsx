
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <img
        src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
        alt="FraserVotes Logo"
        className="h-24 w-auto mb-6 animate-pulse"
      />
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          </div>
          
          <p className="text-lg font-medium text-gray-700 mb-4">{message}</p>
          
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
