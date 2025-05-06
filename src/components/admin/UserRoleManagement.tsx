
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Shield, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SecurityKeyVerification from "@/components/election/SecurityKeyVerification";

type UserRole = "superadmin" | "admin" | "staff" | "student" | "guest" | "checkin" | "vote";

const UserRoleManagement = () => {
  const { authorizedUsers, updateUserRole, isSuperAdmin, fetchAuthorizedUsers } = useAuth();
  const { toast } = useToast();
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, email: string, currentRole: UserRole } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [isKeyVerificationOpen, setIsKeyVerificationOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{userId: string, newRole: UserRole} | null>(null);

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    // Check if the new role is admin or superadmin and requires verification
    if ((newRole === "admin" || newRole === "superadmin") && 
        (selectedUser.currentRole !== "admin" && selectedUser.currentRole !== "superadmin")) {
      setPendingRoleChange({
        userId: selectedUser.id,
        newRole: newRole
      });
      setRoleChangeDialogOpen(false);
      setIsKeyVerificationOpen(true);
    } else {
      // For non-privileged roles, proceed without verification
      await applyRoleChange(selectedUser.id, newRole);
    }
  };

  const applyRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      
      // Refresh the users list to update UI
      await fetchAuthorizedUsers();
      
      toast({
        title: "Success",
        description: `User role updated to ${role}`,
      });
      setRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleKeyVerificationSuccess = async () => {
    if (pendingRoleChange) {
      await applyRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
    }
    setIsKeyVerificationOpen(false);
  };

  const handleKeyVerificationCancel = () => {
    setPendingRoleChange(null);
    setIsKeyVerificationOpen(false);
  };

  const openRoleChangeDialog = (userId: string, userName: string, userEmail: string, currentRole: UserRole) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail, currentRole });
    setNewRole(currentRole);
    setRoleChangeDialogOpen(true);
  };

  // Only superadmins can change roles
  if (!isSuperAdmin()) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium">Access Restricted</h3>
        <p className="text-gray-500 mt-2">
          Only superadmins can manage user roles in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
          User Role Management
        </h2>
        <p className="text-gray-500 mb-6">
          Set specific roles to control what pages users can access:
          <span className="block mt-2 ml-4">• <strong>checkin</strong> - Can only access the Check-In page</span>
          <span className="block ml-4">• <strong>vote</strong> - Can only access the Vote page</span>
          <span className="block ml-4">• <strong>admin</strong> - Can access Admin, Check-In, and Vote pages</span>
          <span className="block ml-4">• <strong>superadmin</strong> - Full access to all pages and features</span>
        </p>

        <div className="mt-6 space-y-4">
          {authorizedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No authorized users found. Add users first to manage their roles.
            </div>
          ) : (
            authorizedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name || user.email}</h3>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="mt-1">
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
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => openRoleChangeDialog(user.id, user.name || "", user.email, user.role)}
                >
                  Change Role
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

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
              {(newRole === "admin" || newRole === "superadmin") && 
               (selectedUser?.currentRole !== "admin" && selectedUser?.currentRole !== "superadmin") && (
                <div className="mt-2 text-amber-600 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Security key verification will be required for admin roles
                </div>
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
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SecurityKeyVerification
        open={isKeyVerificationOpen}
        onOpenChange={setIsKeyVerificationOpen}
        onSuccess={handleKeyVerificationSuccess}
        onCancel={handleKeyVerificationCancel}
      />
    </div>
  );
};

export default UserRoleManagement;
