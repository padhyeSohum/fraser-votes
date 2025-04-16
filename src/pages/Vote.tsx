
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, Lock, Vote as VoteIcon } from "lucide-react";
import Header from "@/components/Header";
import { Candidate, Position, Vote as VoteType } from "@/types";

const Vote = () => {
  const { currentUser } = useAuth();
  const { candidates, positions, settings, submitVote } = useElection();
  const [enteredPin, setEnteredPin] = useState("");
  const [isPinCorrect, setIsPinCorrect] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  
  const isVotingActive = settings.isActive;

  const handlePinSubmit = () => {
    // Clear any previous errors
    setPinError("");
    
    // Check legacy pin first for backward compatibility
    if (enteredPin === settings.pinCode) {
      setIsPinCorrect(true);
      return;
    }
    
    // Then check the pins array
    if (settings.pins && settings.pins.length > 0) {
      const validPin = settings.pins.find(
        p => p.pin === enteredPin && p.isActive
      );
      
      if (validPin) {
        setIsPinCorrect(true);
        return;
      }
    }
    
    // If we get here, pin was invalid
    setPinError("Incorrect PIN. Please try again.");
  };
  
  const selectCandidate = (positionId: string, candidateId: string) => {
    setSelectedCandidates({
      ...selectedCandidates,
      [positionId]: candidateId
    });
  };
  
  const handleSubmitVote = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      const votes: Omit<VoteType, "id" | "timestamp">[] = Object.entries(selectedCandidates).map(
        ([positionId, candidateId]) => ({
          candidateId,
          position: positionId,
          anonymous: false,
        })
      );
      
      await submitVote(votes);
      setHasVoted(true);
    } catch (error) {
      console.error("Error submitting votes:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const candidatesByPosition: Record<string, Candidate[]> = {};
  positions.forEach(position => {
    candidatesByPosition[position.id] = candidates.filter(
      candidate => candidate.position === position.id
    );
  });
  
  if (!isVotingActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto py-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <Lock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Voting is not active</h1>
              <p className="text-gray-600">
                The voting session is currently closed. Please check back later or contact an administrator.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto py-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Thank You for Voting!</h1>
              <p className="text-gray-600 mb-6">
                Your vote has been recorded successfully. Thank you for participating in this election.
              </p>
              <Button variant="outline" onClick={() => setHasVoted(false)}>
                Back to Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{settings.title || "School Election"}</h1>
          <div className="flex items-center gap-2">
            <VoteIcon className="h-5 w-5 text-blue-500" />
            <span className="text-gray-600">Voting Session Active</span>
          </div>
        </div>
        
        {!isPinCorrect ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Enter Voting PIN</CardTitle>
              <CardDescription>
                Please enter the PIN provided by your administrator to access the voting page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="password"
                placeholder="Enter PIN"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="text-center text-xl tracking-widest"
                maxLength={6}
              />
              {pinError && (
                <p className="text-red-500 text-sm mt-2">{pinError}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handlePinSubmit}
                disabled={!enteredPin}
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Voting
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
                <CardDescription>
                  Select one candidate for each position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {positions.map((position) => (
                    <div key={position.id}>
                      <h2 className="text-lg font-bold mb-4">{position.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidatesByPosition[position.id]?.map((candidate) => (
                          <div
                            key={candidate.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedCandidates[position.id] === candidate.id
                                ? "border-blue-500 bg-blue-50"
                                : "hover:border-gray-300"
                            }`}
                            onClick={() => selectCandidate(position.id, candidate.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                                {candidate.photoURL ? (
                                  <img
                                    src={candidate.photoURL}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No Photo
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">{candidate.name}</h3>
                                {candidate.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {candidate.description}
                                  </p>
                                )}
                              </div>
                              {selectedCandidates[position.id] === candidate.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleSubmitVote}
                  disabled={positions.length !== Object.keys(selectedCandidates).length || loading}
                >
                  {loading ? "Submitting..." : "Submit Vote"}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-2">Voting Instructions</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>You must select one candidate for each position</li>
                <li>Click on a candidate's card to select them</li>
                <li>Review your choices carefully before submitting</li>
                <li>Once submitted, you cannot change your vote</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Vote;
