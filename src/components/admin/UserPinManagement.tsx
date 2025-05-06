
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useElection } from "@/contexts/ElectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash, ToggleLeft, ToggleRight, Key, User as UserIcon, Edit, Plus, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SecurityKeyVerification from "@/components/admin/SecurityKeyVerification";
import { PinAccess } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRole = "superadmin" | "admin" | "staff" | "student" | "guest" | "checkin" | "vote";

const UserPinManagement = () => {
  const { authorizedUsers, updateUserRole, removeAuthorizedUser, addAuthorizedUser, isSuperAdmin, fetchAuthorizedUsers, updateUserWithPin } = useAuth();
  const { settings, updateSettings } = useElection();
  const { toast } = useToast();
  
  // User management states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isKeyVerificationOpen, setIsKeyVerificationOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
  });
  
  // PIN management states
  const [pendingAction, setPendingAction] = useState<{
    type: 'add' | 'remove' | 'toggle' | 'unassign' | 'edit';
    pinId?: string;
    userId?: string;
    pinData?: Omit<PinAccess, "id" | "createdAt">;
  } | null>(null);
  
  const [newPin, setNewPin] = useState<Omit<PinAccess, "id" | "createdAt">>({
    name: "",
    pin: "",
    isActive: true
  });

  // Role management states
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, email: string, currentRole: UserRole } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [isRoleKeyVerificationOpen, setIsRoleKeyVerificationOpen] = useState(false);
  
  // PIN edit dialog states
  const [isPinEditDialogOpen, setIsPinEditDialogOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<PinAccess | null>(null);

  // User PIN management functions
  const handleInitiateAddUser = () => {
    if (!newUser.email) {
      setError("Email is required");
      return;
    }
    
    if (!newUser.email.endsWith("@pdsb.net")) {
      setError("Only @pdsb.net emails are allowed");
      return;
    }

    setPendingUser({
      email: newUser.email,
      name: newUser.name || undefined,
      role: "staff"
    });
    setIsKeyVerificationOpen(true);
  };
  
  const handleInitiateRemoveUser = (userId: string) => {
    setPendingRemoveId(userId);
    setIsKeyVerificationOpen(true);
  };
  
  // PIN management functions
  const handleInitiateAddPin = () => {
    if (!newPin.name || !newPin.pin) {
      toast({
        title: "Error",
        description: "Please fill in both name and PIN",
        variant: "destructive"
      });
      return;
    }

    setPendingAction({
      type: 'add',
      pinData: { ...newPin }
    });
    setIsKeyVerificationOpen(true);
  };

  const handleInitiateRemovePin = (pinId: string) => {
    setPendingAction({
      type: 'remove',
      pinId
    });
    setIsKeyVerificationOpen(true);
  };

  const handleInitiateTogglePinStatus = (pinId: string) => {
    setPendingAction({
      type: 'toggle',
      pinId
    });
    setIsKeyVerificationOpen(true);
  };
  
  const handleInitiateEditPin = (pin: PinAccess) => {
    setEditingPin({ ...pin });
    setIsPinEditDialogOpen(true);
  };
  
  const handleSaveEditedPin = () => {
    if (!editingPin) return;
    
    setPendingAction({
      type: 'edit',
      pinId: editingPin.id,
      pinData: {
        name: editingPin.name,
        pin: editingPin.pin,
        isActive: editingPin.isActive
      }
    });
    setIsPinEditDialogOpen(false);
    setIsKeyVerificationOpen(true);
  };

  // Role management functions
  const handleInitiateRoleChange = () => {
    if (!selectedUser) return;
    
    // Only require security key verification for admin and superadmin roles
    if (newRole === "admin" || newRole === "superadmin") {
      setIsRoleKeyVerificationOpen(true);
    } else {
      handleRoleChange();
    }
  };
  
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserRole(selectedUser.id, newRole);
      toast({
        title: "Success",
        description: `${selectedUser.name || selectedUser.email}'s role updated to ${newRole}`,
      });
      setRoleChangeDialogOpen(false);
      setIsRoleKeyVerificationOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const openRoleChangeDialog = (userId: string, userName: string, userEmail: string, currentRole: UserRole) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail, currentRole });
    setNewRole(currentRole);
    setRoleChangeDialogOpen(true);
  };
  
  const handleInitiateUnassignPin = (userId: string) => {
    setPendingAction({
      type: 'unassign',
      userId
    });
    setIsKeyVerificationOpen(true);
  };
  
  // Common security key verification handler
  const handleKeyVerificationSuccess = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      if (pendingUser) {
        await addAuthorizedUser(pendingUser);
        setNewUser({ email: "", name: "" });
        setPendingUser(null);
      } else if (pendingRemoveId) {
        await removeAuthorizedUser(pendingRemoveId);
        setPendingRemoveId(null);
      } else if (pendingAction) {
        const updatedPins = [...(settings.pins || [])];
        
        if (pendingAction.type === 'add' && pendingAction.pinData) {
          updatedPins.push({
            id: crypto.randomUUID(),
            ...pendingAction.pinData,
            createdAt: new Date()
          });
          
          setNewPin({
            name: "",
            pin: "",
            isActive: true
          });
          
          toast({
            title: "Success",
            description: "PIN added successfully"
          });
        } else if (pendingAction.type === 'remove' && pendingAction.pinId) {
          const filteredPins = updatedPins.filter(pin => pin.id !== pendingAction.pinId);
          updatedPins.splice(0, updatedPins.length, ...filteredPins);
          
          // Also remove this PIN from any users it might be assigned to
          const updatedUsers = [...authorizedUsers];
          for (let i = 0; i < updatedUsers.length; i++) {
            if (updatedUsers[i]?.assignedPinId === pendingAction.pinId) {
              await updateUserWithPin(updatedUsers[i].id, null);
            }
          }
          
          toast({
            title: "Success",
            description: "PIN removed successfully"
          });
        } else if (pendingAction.type === 'toggle' && pendingAction.pinId) {
          const pinIndex = updatedPins.findIndex(pin => pin.id === pendingAction.pinId);
          if (pinIndex !== -1) {
            updatedPins[pinIndex] = {
              ...updatedPins[pinIndex],
              isActive: !updatedPins[pinIndex].isActive
            };
          }
          
          toast({
            title: "Success",
            description: "PIN status updated"
          });
        } else if (pendingAction.type === 'edit' && pendingAction.pinId && pendingAction.pinData) {
          const pinIndex = updatedPins.findIndex(pin => pin.id === pendingAction.pinId);
          if (pinIndex !== -1) {
            updatedPins[pinIndex] = {
              ...updatedPins[pinIndex],
              ...pendingAction.pinData
            };
          }
          
          toast({
            title: "Success",
            description: "PIN updated successfully"
          });
        } else if (pendingAction.type === 'unassign' && pendingAction.userId) {
          await updateUserWithPin(pendingAction.userId, null);
          
          toast({
            title: "Success",
            description: "PIN unassigned from user successfully"
          });
        }
        
        updateSettings({
          ...settings,
          pins: updatedPins
        });
        
        setPendingAction(null);
      }
    } catch (error: any) {
      console.error("Error managing user or PIN:", error);
      setError(error.message || "Failed to perform the requested action");
      toast({
        title: "Error",
        description: error.message || "Failed to perform the requested action",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsKeyVerificationOpen(false);
    }
  };
  
  const handleRoleKeyVerificationSuccess = () => {
    handleRoleChange();
  };
  
  const handleRoleKeyVerificationCancel = () => {
    setIsRoleKeyVerificationOpen(false);
  };
  
  const handleKeyVerificationCancel = () => {
    setPendingUser(null);
    setPendingRemoveId(null);
    setPendingAction(null);
    setIsKeyVerificationOpen(false);
  };

  // Helper function to get PIN details by ID
  const getPinById = (pinId: string | null | undefined) => {
    if (!pinId) return null;
    return settings.pins?.find(pin => pin.id === pinId) || null;
  };

  // Only superadmins can change roles
  if (!isSuperAdmin()) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium">Access Restricted</h3>
        <p className="text-gray-500 mt-2">
          Only superadmins can manage users and PINs in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Authorized User</CardTitle>
          <CardDescription>
            Add users who can access the FraserVotes platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  placeholder="user@pdsb.net" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleInitiateAddUser} 
            disabled={isLoading || !newUser.email}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <UserIcon className="h-4 w-4 mr-2" />
            )}
            Add User
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add PIN</CardTitle>
          <CardDescription>
            Create PINs for access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pin-name">Name/Description</Label>
              <Input
                id="pin-name"
                placeholder="e.g., Grade 9 Students"
                value={newPin.name}
                onChange={(e) => setNewPin({...newPin, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="pin-code">PIN Code</Label>
              <Input
                id="pin-code"
                placeholder="Enter PIN"
                value={newPin.pin}
                onChange={(e) => setNewPin({...newPin, pin: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleInitiateAddPin} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add PIN
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>PIN Management</CardTitle>
          <CardDescription>
            Manage available PINs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.pins?.map(pin => (
              <div key={pin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{pin.name}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Key className="h-4 w-4 mr-1" />
                    PIN: {pin.pin}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInitiateEditPin(pin)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={pin.isActive ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleInitiateTogglePinStatus(pin.id)}
                  >
                    {pin.isActive ? 
                      <ToggleRight className="h-4 w-4 mr-2" /> : 
                      <ToggleLeft className="h-4 w-4 mr-2" />
                    }
                    {pin.isActive ? "Enabled" : "Disabled"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleInitiateRemovePin(pin.id)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {(!settings.pins || settings.pins.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No PINs added yet. Add a PIN above to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage authorized users and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authorizedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No authorized users found. Add a user above to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned PIN</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authorizedUsers.map((user) => {
                  const assignedPin = getPinById(user.assignedPinId);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name || user.email}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span 
                            className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                              user.role === "superadmin" 
                                ? "bg-purple-100 text-purple-800" 
                                : user.role === "admin" 
                                ? "bg-blue-100 text-blue-800" 
                                : user.role === "checkin" 
                                ? "bg-green-100 text-green-800" 
                                : user.role === "vote" 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRoleChangeDialog(user.id, user.name || "", user.email, user.role)}
                            className="ml-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignedPin ? (
                          <div className="flex items-center">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{assignedPin.name}</span>
                              <span className="text-xs text-gray-500">PIN: {assignedPin.pin}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInitiateUnassignPin(user.id)}
                              className="ml-2"
                            >
                              <Trash className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No PIN assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInitiateRemoveUser(user.id)}
                          className="text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role change dialog */}
      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  Update role for <strong>{selectedUser.name || selectedUser.email}</strong>. 
                  This will change what pages the user can access.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Select Role</div>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkin">Check-In Only</SelectItem>
                  <SelectItem value="vote">Vote Only</SelectItem>
                  <SelectItem value="staff">Staff (No Specific Access)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {(newRole === "admin" || newRole === "superadmin") && (
                <p className="text-sm text-amber-600">
                  Note: Changing to {newRole} role will require security key verification.
                </p>
              )}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInitiateRoleChange}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIN edit dialog */}
      <Dialog open={isPinEditDialogOpen} onOpenChange={setIsPinEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit PIN</DialogTitle>
            <DialogDescription>
              Update PIN details
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pin-name">Name/Description</Label>
              <Input
                id="edit-pin-name"
                value={editingPin?.name || ""}
                onChange={(e) => editingPin && setEditingPin({...editingPin, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pin-code">PIN Code</Label>
              <Input
                id="edit-pin-code"
                value={editingPin?.pin || ""}
                onChange={(e) => editingPin && setEditingPin({...editingPin, pin: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPinEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedPin}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SecurityKeyVerification
        open={isKeyVerificationOpen}
        onOpenChange={setIsKeyVerificationOpen}
        onSuccess={handleKeyVerificationSuccess}
        onCancel={handleKeyVerificationCancel}
      />

      <SecurityKeyVerification
        open={isRoleKeyVerificationOpen}
        onOpenChange={setIsRoleKeyVerificationOpen}
        onSuccess={handleRoleKeyVerificationSuccess}
        onCancel={handleRoleKeyVerificationCancel}
      />
    </div>
  );
};

export default UserPinManagement;
