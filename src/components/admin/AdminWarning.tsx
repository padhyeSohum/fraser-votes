
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminWarning = ({ onProceed }: { onProceed: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center text-white p-4">
      <div className="max-w-lg text-center space-y-6">
        <AlertCircle className="h-16 w-16 mx-auto text-amber-500" />
        <h2 className="text-2xl font-bold">⚠️ Warning: Voting Results Ahead ⚠️</h2>
        <p className="text-lg">
          This screen has live elections results visible. 
        </p>
        <div className="pt-4">
          <Button 
            onClick={onProceed}
            size="lg"
            variant="destructive"
            className="w-full sm:w-auto"
          >
            I Understand, Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminWarning;
