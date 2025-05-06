
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, Lock, Vote as VoteIcon } from "lucide-react";
import Header from "@/components/Header";
import { Candidate, Position, Vote as VoteType } from "@/types";
import { useSecurityKey } from "@/contexts/SecurityKeyContext";

const Vote = () => {
  const { currentUser } = useAuth();
  const { candidates, positions, settings, submitVote } = useElection();
  const { clearSecurityKeySession } = useSecurityKey();
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
  
  const resetVotingSession = () => {
    setIsPinCorrect(false);
    setEnteredPin("");
    setSelectedCandidates({});
    setHasVoted(false);
    setLoading(false);
    setPinError("");
    // Also clear the security key session so the next user needs to re-verify if needed
    clearSecurityKeySession();
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
      
      // Show the success screen
      setHasVoted(true);
      
      // Set a timeout to automatically return to the pin entry screen after showing success
      setTimeout(() => {
        resetVotingSession();
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting votes:", error);
      setLoading(false);
    }
  };
  
  // Clear any selected candidates when pin is first validated
  useEffect(() => {
    if (isPinCorrect) {
      setSelectedCandidates({});
    }
  }, [isPinCorrect]);
  
  const candidatesByPosition: Record<string, Candidate[]> = {};
  positions.forEach(position => {
    candidatesByPosition[position.id] = candidates.filter(
      candidate => candidate.position === position.id
    );
  });
  
  if (!isVotingActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="container mx-auto py-16 px-4 flex-grow">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 shadow-md">
              <Lock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Voting is not active</h1>
              <p className="text-gray-600">
                The voting session is currently closed. Please check back later or contact Aleena, Cody or Akshat if you believe this is an error.
              </p>
            </div>
          </div>
        </main>
        
        {/* Footer is now handled by App.tsx, so we don't need to include it here */}
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="container mx-auto py-16 px-4 flex-grow">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 shadow-md animate-fade-in">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Thank You for Voting!</h1>
              <p className="text-gray-600 mb-6">
                Your vote has been recorded successfully. Thank you for participating in this election.
              </p>
              <p className="text-gray-500 italic text-sm">Returning to voting screen...</p>
            </div>
          </div>
        </main>
        
        {/* Footer is now handled by App.tsx, so we don't need to include it here */}
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Add header with hover area */}
      <div className="relative">
        <Header />
        {/* Invisible hover area at the top of the page when header is hidden */}
        <div 
          className="absolute top-0 left-0 w-full h-8 z-40" 
          onMouseEnter={() => document.querySelector('header')?.classList.add('translate-y-0')}
        />
      </div>
      
      <main className="container mx-auto py-8 px-4 flex-grow">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {settings.title || "Student Activity Council Elections"}
          </h1>
          
          <div className="flex items-center gap-2 mt-2 bg-blue-100 px-4 py-1 rounded-full">
            <VoteIcon className="h-5 w-5 text-blue-500" />
            <span className="text-blue-700 font-medium">Voting Session Active</span>
          </div>
        </div>
        
        {!isPinCorrect ? (
          <div className="max-w-md mx-auto mt-12">
            <Card className="border-t-4 border-t-blue-500 shadow-lg animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Unlock Polling Station</CardTitle>
                <CardDescription className="text-center">
                  Please enter your SAC member pin to access the ballot
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter PIN"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="text-center text-xl tracking-widest bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && enteredPin) {
                      handlePinSubmit();
                    }
                  }}
                />
                {pinError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{pinError}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handlePinSubmit}
                  disabled={!enteredPin}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock Voting
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-center mt-6 text-sm text-gray-500">
              SAC Elections powered by Fraser Votes
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <Card className="mb-8 shadow-lg overflow-hidden border-t-4 border-t-blue-500">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Cast Your Vote</h2>
                <p className="text-sm text-gray-600">Select one candidate for each position</p>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-8">
                  {positions.map((position) => (
                    <div key={position.id} className="pb-6 last:pb-0 border-b last:border-b-0 border-gray-100">
                      <h2 className="text-lg font-bold mb-4 px-2 py-1 bg-blue-50 rounded-md text-blue-800 inline-block">
                        {position.title}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                        {candidatesByPosition[position.id]?.map((candidate) => (
                          <div
                            key={candidate.id}
                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedCandidates[position.id] === candidate.id
                                ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                                : "hover:border-gray-300 bg-white"
                            }`}
                            onClick={() => selectCandidate(position.id, candidate.id)}
                          >
                            <div className="flex items-start p-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-gray-100">
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
                              <div className="flex-1 ml-4">
                                <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                                {candidate.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                                    {candidate.description}
                                  </p>
                                )}
                              </div>
                              {selectedCandidates[position.id] === candidate.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-6 py-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmitVote}
                  disabled={positions.length !== Object.keys(selectedCandidates).length || loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <>Submit Vote</>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-white p-6 rounded-lg shadow-md mb-6 border-t-4 border-t-blue-500">
              <h2 className="text-lg font-bold mb-3 text-gray-800">Voting Instructions</h2>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>You must select one candidate for each position</li>
                <li>Click on a candidate's card to select them</li>
                <li>Review your choices carefully before submitting</li>
                <li>Once submitted, you cannot change your vote</li>
              </ol>
            </Card>
            
            <div className="text-center my-6 text-sm text-gray-500">
              SAC Elections powered by Fraser Votes
            </div>
          </div>
        )}
      </main>
      
      {/* Footer is now handled by App.tsx, so we don't need to include it here */}
    </div>
  );
};

export default Vote;
