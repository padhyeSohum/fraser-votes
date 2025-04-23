import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, ListPlus, Power, Lock } from "lucide-react";
import StudentManagement from "@/components/admin/StudentManagement";
import UserManagement from "@/components/admin/UserManagement";
import SecurityKeyManagement from "@/components/admin/SecurityKeyManagement";
import SecurityKeyVerification from "@/components/election/SecurityKeyVerification";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { userData, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState("students");
  const [isElectionActive, setIsElectionActive] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isStartStopVerificationOpen, setIsStartStopVerificationOpen] = useState(false);
  const [pendingElectionAction, setPendingElectionAction] = useState<'start' | 'stop' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    election, 
    positions, 
    startElection, 
    endElection, 
    addPosition, 
    removePosition,
    fetchElectionStatus,
    fetchPositions
  } = useElection();

  useEffect(() => {
    if (!userData || !isSuperAdmin()) {
      navigate("/");
    }
  }, [userData, isSuperAdmin, navigate]);

  useEffect(() => {
    const checkElectionStatus = async () => {
      setIsLoading(true);
      try {
        await fetchElectionStatus();
        setIsElectionActive(election?.active || false);
      } catch (error) {
        console.error("Error fetching election status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch election status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkElectionStatus();
  }, [fetchElectionStatus, election?.active, toast]);

  useEffect(() => {
    const loadPositions = async () => {
      setIsLoading(true);
      try {
        await fetchPositions();
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch positions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPositions();
  }, [fetchPositions, toast]);

  const handleTabChange = (value: string) => {
    setTab(value);
  };

  const handleAddPositionOpen = () => {
    setIsAddPositionOpen(true);
  };

  const handleAddPositionClose = () => {
    setIsAddPositionOpen(false);
    setNewPositionName("");
  };

  const handlePositionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPositionName(e.target.value);
  };

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) {
      toast({
        title: "Error",
        description: "Position name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPosition(newPositionName.trim());
      toast({
        title: "Success",
        description: `${newPositionName.trim()} position added successfully`,
      });
      handleAddPositionClose();
    } catch (error: any) {
      console.error("Error adding position:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add position",
        variant: "destructive",
      });
    }
  };

  const handleRemovePosition = async (positionId: string) => {
    try {
      await removePosition(positionId);
      toast({
        title: "Success",
        description: "Position removed successfully",
      });
    } catch (error: any) {
      console.error("Error removing position:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove position",
        variant: "destructive",
      });
    }
  };

  const handleElectionControl = (action: 'start' | 'stop') => {
    setPendingElectionAction(action);
    setIsStartStopVerificationOpen(true);
  };

  const handleElectionKeyVerificationSuccess = async () => {
    if (pendingElectionAction === 'start') {
      await startElection();
    } else if (pendingElectionAction === 'stop') {
      await endElection();
    }
    
    setIsStartStopVerificationOpen(false);
    setPendingElectionAction(null);
    
    toast({
      title: "Success",
      description: `Election ${pendingElectionAction === 'start' ? 'started' : 'stopped'} successfully`,
    });
  };

  const handleElectionKeyVerificationCancel = () => {
    setIsStartStopVerificationOpen(false);
    setPendingElectionAction(null);
  };

  if (!userData || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="security">Security Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <StudentManagement />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="positions">
          <div className="grid gap-4">
            <h2 className="text-2xl font-semibold mb-4">Election Positions</h2>
            <div className="flex items-center justify-between">
              <Button onClick={handleAddPositionOpen}><ListPlus className="mr-2 h-4 w-4" /> Add Position</Button>
              <div>
                {isElectionActive ? (
                  <Button variant="destructive" onClick={() => handleElectionControl('stop')} disabled={isLoading}>
                    {isLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Power className="mr-2 h-4 w-4" />}
                    Stop Election
                  </Button>
                ) : (
                  <Button onClick={() => handleElectionControl('start')} disabled={isLoading}>
                    {isLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Power className="mr-2 h-4 w-4" />}
                    Start Election
                  </Button>
                )}
              </div>
            </div>
            <ul className="list-none pl-0">
              {positions && positions.map((position) => (
                <li key={position.id} className="py-2 border-b border-gray-200 flex items-center justify-between">
                  <span>{position.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the {position.name} position and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemovePosition(position.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
        <TabsContent value="security">
          <SecurityKeyManagement />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Position</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the name of the new election position.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input 
                type="text" 
                placeholder="Position Name" 
                value={newPositionName} 
                onChange={handlePositionNameChange} 
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAddPositionClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddPosition}>Add</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isStartStopVerificationOpen} onOpenChange={setIsStartStopVerificationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Security Key</AlertDialogTitle>
            <AlertDialogDescription>
              Please verify your security key to {pendingElectionAction === 'start' ? 'start' : 'stop'} the election.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <SecurityKeyVerification 
            onSuccess={handleElectionKeyVerificationSuccess}
            onCancel={handleElectionKeyVerificationCancel}
          />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
