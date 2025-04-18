
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash, Edit, BarChart2, Settings, Users, 
  UserCheck, Key, UserPlus, Lock, Power, AlertTriangle 
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Position, Candidate, PinAccess } from "@/types";
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import StudentManagement from "@/components/admin/StudentManagement";
import UserManagement from "@/components/admin/UserManagement";

const Admin = () => {
  const { userData, isSuperAdmin } = useAuth();
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
    getResults,
    resetElection
  } = useElection();
  
  const [currentTab, setCurrentTab] = useState("candidates");
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isEditPositionOpen, setIsEditPositionOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isEditCandidateOpen, setIsEditCandidateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [results, setResults] = useState<Record<string, Candidate[]>>({});
  const [resetPassword, setResetPassword] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const [newPosition, setNewPosition] = useState<Omit<Position, "id">>({
    title: "",
    description: "",
    order: positions.length
  });
  
  const [editPosition, setEditPosition] = useState<Position>({
    id: "",
    title: "",
    description: "",
    order: 0
  });
  
  const [newCandidate, setNewCandidate] = useState<Omit<Candidate, "id" | "votes">>({
    name: "",
    position: positions[0]?.id || "",
    photoURL: "",
    description: ""
  });
  
  const [editCandidate, setEditCandidate] = useState<Omit<Candidate, "votes">>({
    id: "",
    name: "",
    position: "",
    photoURL: "",
    description: ""
  });
  
  const [newSettings, setNewSettings] = useState({
    title: settings.title
  });

  const [newPin, setNewPin] = useState<Omit<PinAccess, "id" | "createdAt">>({
    name: "",
    pin: "",
    isActive: true
  });
  
  const navigate = useNavigate();
  
  // Add back the handler functions that were removed
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
  
  const handleEditPosition = async () => {
    if (!editPosition.title || !editPosition.id) return;
    
    const { id, ...positionData } = editPosition;
    await updatePosition(id, positionData);
    setIsEditPositionOpen(false);
  };
  
  const handleOpenEditPosition = (position: Position) => {
    setEditPosition({...position});
    setIsEditPositionOpen(true);
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
  
  const handleEditCandidate = async () => {
    if (!editCandidate.name || !editCandidate.position || !editCandidate.id) return;
    
    const { id, ...candidateData } = editCandidate;
    await updateCandidate(id, candidateData);
    setIsEditCandidateOpen(false);
  };
  
  const handleOpenEditCandidate = (candidate: Candidate) => {
    setEditCandidate({
      id: candidate.id,
      name: candidate.name,
      position: candidate.position,
      photoURL: candidate.photoURL || "",
      description: candidate.description || ""
    });
    setIsEditCandidateOpen(true);
  };
  
  const handleUpdateSettings = async () => {
    await updateSettings({
      ...settings,
      title: newSettings.title
    });
    setIsSettingsOpen(false);
  };

  const handleAddPin = () => {
    if (!newPin.name || !newPin.pin) return;
    
    const updatedPins = [...(settings.pins || [])];
    
    updatedPins.push({
      id: uuidv4(),
      ...newPin
    });
    
    updateSettings({ 
      ...settings, 
      pins: updatedPins
    });
    
    setNewPin({
      name: "",
      pin: "",
      isActive: true
    });
  };

  const handleRemovePin = (pinId: string) => {
    if (!settings.pins) return;
    
    const updatedPins = settings.pins.filter(pin => pin.id !== pinId);
    updateSettings({ 
      ...settings, 
      pins: updatedPins
    });
  };

  const handleTogglePinStatus = (pinId: string) => {
    if (!settings.pins) return;
    
    const updatedPins = settings.pins.map(pin => 
      pin.id === pinId ? { ...pin, isActive: !pin.isActive } : pin
    );
    
    updateSettings({ 
      ...settings, 
      pins: updatedPins
    });
  };
  
  const handleFetchResults = async () => {
    const data = await getResults();
    setResults(data);
  };

  const handleReset = () => {
    if (!resetPassword || resetPassword.trim() === "") {
      return;
    }
    
    resetElection(resetPassword);
    setResetPassword("");
    setIsResetDialogOpen(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 mt-1">Manage your election settings and data</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant={settings.isActive ? "destructive" : "default"}
                className="shadow-sm"
                onClick={settings.isActive ? endElection : startElection}
              >
                <Power className="h-4 w-4 mr-2" />
                {settings.isActive ? 'End Voting' : 'Start Voting'}
              </Button>
              
              <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shadow-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reset Election
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Election Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will remove all positions, candidates, and voting results. It will also reset all student check-ins.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="reset-password">Enter Password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Enter the reset password"
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setResetPassword("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{positions.length}</div>
                <p className="text-xs text-muted-foreground">Election positions defined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{candidates.length}</div>
                <p className="text-xs text-muted-foreground">Registered candidates</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Election Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings.isActive ? 'Active' : 'Inactive'}</div>
                <p className="text-xs text-muted-foreground">Current election state</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs 
          defaultValue="candidates" 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex h-12 items-center text-muted-foreground bg-white rounded-md p-1 text-sm font-medium shadow-sm">
            <TabsTrigger value="candidates" className="rounded-sm px-4 py-2 hover:text-foreground data-[state=active]:text-primary">
              <Users className="h-4 w-4 mr-2" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-sm px-4 py-2 hover:text-foreground data-[state=active]:text-primary">
              <UserPlus className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            {isSuperAdmin() && (
              <TabsTrigger value="results" className="rounded-sm px-4 py-2 hover:text-foreground data-[state=active]:text-primary">
                <BarChart2 className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="rounded-sm px-4 py-2 hover:text-foreground data-[state=active]:text-primary">
              <UserCheck className="h-4 w-4 mr-2" />
              User Access
            </TabsTrigger>
          </TabsList>
          
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenEditPosition(position)}
                          >
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
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleOpenEditCandidate(candidate)}
                                      >
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

            <Dialog open={isEditPositionOpen} onOpenChange={setIsEditPositionOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Position</DialogTitle>
                  <DialogDescription>
                    Update this position's details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-position-title">Title</Label>
                    <Input
                      id="edit-position-title"
                      value={editPosition.title}
                      onChange={(e) => setEditPosition({...editPosition, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position-description">Description (Optional)</Label>
                    <Input
                      id="edit-position-description"
                      value={editPosition.description || ""}
                      onChange={(e) => setEditPosition({...editPosition, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position-order">Display Order</Label>
                    <Input
                      id="edit-position-order"
                      type="number"
                      value={editPosition.order}
                      onChange={(e) => setEditPosition({...editPosition, order: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditPositionOpen(false)}>Cancel</Button>
                  <Button onClick={handleEditPosition}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditCandidateOpen} onOpenChange={setIsEditCandidateOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Candidate</DialogTitle>
                  <DialogDescription>
                    Update this candidate's details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-candidate-name">Name</Label>
                    <Input
                      id="edit-candidate-name"
                      value={editCandidate.name}
                      onChange={(e) => setEditCandidate({...editCandidate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-candidate-position">Position</Label>
                    <select 
                      id="edit-candidate-position"
                      className="w-full p-2 border rounded-md"
                      value={editCandidate.position}
                      onChange={(e) => setEditCandidate({...editCandidate, position: e.target.value})}
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
                    <Label htmlFor="edit-candidate-photo">Photo URL</Label>
                    <Input
                      id="edit-candidate-photo"
                      value={editCandidate.photoURL || ""}
                      onChange={(e) => setEditCandidate({...editCandidate, photoURL: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-candidate-description">Bio (Optional)</Label>
                    <Input
                      id="edit-candidate-description"
                      value={editCandidate.description || ""}
                      onChange={(e) => setEditCandidate({...editCandidate, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditCandidateOpen(false)}>Cancel</Button>
                  <Button onClick={handleEditCandidate}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>
          
          {isSuperAdmin() && (
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
          )}
          
          <TabsContent value="users">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">User Access Management</h2>
            </div>
            
            <UserManagement />
          </TabsContent>
        </Tabs>
        
        {!isSuperAdmin() && currentTab === "results" && (
          <div className="mt-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Results Access Restricted</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Only superadmins can view election results. This helps maintain the integrity and confidentiality of the voting process.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
