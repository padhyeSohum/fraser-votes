
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Edit, BarChart2, Settings, Users, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Position, Candidate } from "@/types";

// Components
import Header from "@/components/Header";

const Admin = () => {
  const { userData } = useAuth();
  const { 
    positions, 
    candidates, 
    settings,
    loading,
    addPosition,
    updatePosition,
    removePosition,
    addCandidate,
    updateCandidate,
    removeCandidate,
    updateSettings,
    startElection,
    endElection,
    getResults
  } = useElection();
  
  const [currentTab, setCurrentTab] = useState("candidates");
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [results, setResults] = useState<Record<string, Candidate[]>>({});
  
  // Form states
  const [newPosition, setNewPosition] = useState<Omit<Position, "id">>({
    title: "",
    description: "",
    order: positions.length
  });
  
  const [newCandidate, setNewCandidate] = useState<Omit<Candidate, "id" | "votes">>({
    name: "",
    position: positions[0]?.id || "",
    photoURL: "",
    description: ""
  });
  
  const [newSettings, setNewSettings] = useState({
    pinCode: settings.pinCode,
    title: settings.title,
    allowMultipleVotes: settings.allowMultipleVotes
  });
  
  const navigate = useNavigate();
  
  // Check if user is super admin
  const isSuperAdmin = userData?.role === "superadmin";
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const handleAddPosition = async () => {
    if (!newPosition.title) return;
    
    await addPosition(newPosition);
    setNewPosition({
      title: "",
      description: "",
      order: positions.length + 1
    });
    setIsAddPositionOpen(false);
  };
  
  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.position) return;
    
    await addCandidate(newCandidate);
    setNewCandidate({
      name: "",
      position: positions[0]?.id || "",
      photoURL: "",
      description: ""
    });
    setIsAddCandidateOpen(false);
  };
  
  const handleUpdateSettings = async () => {
    await updateSettings(newSettings);
    setIsSettingsOpen(false);
  };
  
  const handleFetchResults = async () => {
    const data = await getResults();
    setResults(data);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            {settings.isActive ? (
              <Button 
                variant="destructive" 
                onClick={endElection}
              >
                End Voting
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={startElection}
              >
                Start Voting
              </Button>
            )}
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Election Settings</DialogTitle>
                  <DialogDescription>
                    Configure the election settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code</Label>
                    <Input
                      id="pinCode"
                      value={newSettings.pinCode}
                      onChange={(e) => setNewSettings({...newSettings, pinCode: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Election Title</Label>
                    <Input
                      id="title"
                      value={newSettings.title}
                      onChange={(e) => setNewSettings({...newSettings, title: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multiple-votes"
                      checked={newSettings.allowMultipleVotes}
                      onCheckedChange={(checked) => setNewSettings({...newSettings, allowMultipleVotes: checked})}
                    />
                    <Label htmlFor="multiple-votes">Allow Multiple Votes</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateSettings}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="candidates" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" disabled={!isSuperAdmin}>
              <UserCheck className="h-4 w-4" />
              User Roles
            </TabsTrigger>
          </TabsList>
          
          {/* Candidates Tab Content */}
          <TabsContent value="candidates" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Manage Positions & Candidates</h2>
              <div className="flex gap-2">
                <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Position</DialogTitle>
                      <DialogDescription>
                        Create a new position for candidates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="position-title">Title</Label>
                        <Input
                          id="position-title"
                          placeholder="e.g., President"
                          value={newPosition.title}
                          onChange={(e) => setNewPosition({...newPosition, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position-description">Description (Optional)</Label>
                        <Input
                          id="position-description"
                          placeholder="e.g., Leads the student council"
                          value={newPosition.description}
                          onChange={(e) => setNewPosition({...newPosition, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position-order">Display Order</Label>
                        <Input
                          id="position-order"
                          type="number"
                          value={newPosition.order}
                          onChange={(e) => setNewPosition({...newPosition, order: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPosition}>Add Position</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Candidate</DialogTitle>
                      <DialogDescription>
                        Add a new candidate to the election
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="candidate-name">Name</Label>
                        <Input
                          id="candidate-name"
                          placeholder="e.g., John Smith"
                          value={newCandidate.name}
                          onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-position">Position</Label>
                        <select 
                          id="candidate-position"
                          className="w-full p-2 border rounded-md"
                          value={newCandidate.position}
                          onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                        >
                          <option value="">Select a position</option>
                          {positions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-photo">Photo URL</Label>
                        <Input
                          id="candidate-photo"
                          placeholder="https://example.com/photo.jpg"
                          value={newCandidate.photoURL}
                          onChange={(e) => setNewCandidate({...newCandidate, photoURL: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate-description">Bio (Optional)</Label>
                        <Input
                          id="candidate-description"
                          placeholder="Brief description of the candidate"
                          value={newCandidate.description}
                          onChange={(e) => setNewCandidate({...newCandidate, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddCandidate}>Add Candidate</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {positions.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-500">No positions defined yet. Add a position to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {positions.map((position) => {
                  const positionCandidates = candidates.filter(c => c.position === position.id);
                  
                  return (
                    <Card key={position.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>{position.title}</CardTitle>
                          {position.description && (
                            <CardDescription>{position.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removePosition(position.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {positionCandidates.length === 0 ? (
                          <p className="text-gray-500 text-center">No candidates for this position yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {positionCandidates.map((candidate) => (
                              <div key={candidate.id} className="p-4 border rounded-lg flex items-start space-x-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  {candidate.photoURL ? (
                                    <img 
                                      src={candidate.photoURL} 
                                      alt={candidate.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      No photo
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <h3 className="font-medium">{candidate.name}</h3>
                                    <div className="flex items-center space-x-1">
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => removeCandidate(candidate.id)}
                                      >
                                        <Trash className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                  {candidate.description && (
                                    <p className="text-sm text-gray-500 mt-1">{candidate.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* Results Tab Content */}
          <TabsContent value="results">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Election Results</h2>
              <Button onClick={handleFetchResults}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Refresh Results
              </Button>
            </div>
            
            {Object.keys(results).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <BarChart2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No voting results yet. Click "Refresh Results" to see the latest voting data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.keys(results).map((positionId) => {
                  const position = positions.find(p => p.id === positionId);
                  const candidatesList = results[positionId];
                  
                  if (!position) return null;
                  
                  // Find the maximum number of votes for this position
                  const maxVotes = Math.max(...candidatesList.map(c => c.votes), 1);
                  
                  return (
                    <Card key={positionId}>
                      <CardHeader>
                        <CardTitle>{position.title}</CardTitle>
                        <CardDescription>
                          Total Votes: {candidatesList.reduce((sum, c) => sum + c.votes, 0)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {candidatesList.map((candidate) => (
                            <div key={candidate.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                                    {candidate.photoURL ? (
                                      <img 
                                        src={candidate.photoURL} 
                                        alt={candidate.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-medium">{candidate.name}</span>
                                </div>
                                <span className="text-sm font-medium">{candidate.votes} votes</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(candidate.votes / maxVotes) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* User Roles Tab Content (Super Admin Only) */}
          <TabsContent value="users">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">User Role Management</h2>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>
                  Manage user access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4 text-gray-500">
                  User role management features would be implemented here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
