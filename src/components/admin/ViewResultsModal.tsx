
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart2, Lock, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Position, Candidate } from "@/types";

interface ViewResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  getResults: () => Promise<Record<string, Candidate[]>>;
}

type ModalStep = 'password' | 'confirmation' | 'results';

export const ViewResultsModal = ({ isOpen, onClose, positions, getResults }: ViewResultsModalProps) => {
  const [step, setStep] = useState<ModalStep>('password');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = () => {
    if (password !== 'nachofriesarecool') {
      toast({
        title: "Invalid Password",
        description: "Please check the password and try again",
        variant: "destructive",
      });
      return;
    }
    setStep('confirmation');
  };

  const handleConfirmView = async () => {
    setLoading(true);
    try {
      const data = await getResults();
      setResults(data);
      setStep('results');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('password');
    setPassword('');
    setResults({});
    onClose();
  };

  const renderPasswordStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Enter Password</DialogTitle>
        <DialogDescription>
          Please enter the password to view election results
        </DialogDescription>
      </DialogHeader>
      <div className="py-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the results password"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button onClick={handlePasswordSubmit}>
          <Lock className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Access</DialogTitle>
        <DialogDescription>
          Are you sure you want to view the election results?
        </DialogDescription>
      </DialogHeader>
      <div className="py-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-center text-gray-600">
          This action will display all current voting results.
          Please ensure you have permission to view this data.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirmView} disabled={loading}>
          {loading ? (
            "Loading..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              View Results
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderResults = () => (
    <>
      <DialogHeader>
        <DialogTitle>Election Results</DialogTitle>
        <DialogDescription>
          Current voting results for all positions
        </DialogDescription>
      </DialogHeader>
      <div className="py-6 max-h-[70vh] overflow-y-auto space-y-6">
        {Object.keys(results).map((positionId) => {
          const position = positions.find(p => p.id === positionId);
          const candidatesList = results[positionId];
          
          if (!position) return null;
          
          const totalVotes = candidatesList.reduce((sum, c) => sum + c.votes, 0);
          const maxVotes = Math.max(...candidatesList.map(c => c.votes), 1);
          
          return (
            <Card key={positionId} className="border rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {position.title}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({totalVotes} total votes)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidatesList.map((candidate) => (
                    <div key={candidate.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {candidate.photoURL && (
                            <img 
                              src={candidate.photoURL} 
                              alt={candidate.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{candidate.name}</span>
                        </div>
                        <span className="text-gray-600">
                          {candidate.votes} votes ({((candidate.votes / totalVotes) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(candidate.votes / maxVotes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DialogFooter>
        <Button onClick={handleClose}>Close</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 'password' && renderPasswordStep()}
        {step === 'confirmation' && renderConfirmationStep()}
        {step === 'results' && renderResults()}
      </DialogContent>
    </Dialog>
  );
};
