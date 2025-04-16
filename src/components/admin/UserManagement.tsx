
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, UserPlus, Mail, User as UserIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

const UserManagement = () => {
  const { authorizedUsers, addAuthorizedUser, removeAuthorizedUser, fetchAuthorizedUsers } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "staff" as "superadmin" | "admin" | "staff" | "student" | "guest"
  });
  
  const handleAddUser = async () => {
    setIsLoading(true);
    setError("");
    
    if (!newUser.email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    
    if (!newUser.email.endsWith("@pdsb.net")) {
      setError("Only @pdsb.net emails are allowed");
      setIsLoading(false);
      return;
    }
    
    try {
      await addAuthorizedUser({
        email: newUser.email,
        name: newUser.name || undefined,
        role: newUser.role
      });
      
      // Reset form
      setNewUser({
        email: "",
        name: "",
        role: "staff"
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      setError(error.message || "Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveUser = async (userId: string, userName: string) => {
    try {
      await removeAuthorizedUser(userId);
      toast({
        title: "User Removed",
        description: `${userName} has been removed from authorized users`
      });
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove user",
        variant: "destructive"
      });
    }
  };
  
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({
                  ...newUser, 
                  role: value as "superadmin" | "admin" | "staff" | "student" | "guest"
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleAddUser} 
            disabled={isLoading || !newUser.email}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add User
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Authorized Users</CardTitle>
          <CardDescription>
            Users who can access the FraserVotes platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authorizedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No authorized users found. Add a user above to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {authorizedUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{user.name || user.email}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="ml-5">
                        Role: <span className="font-medium capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(user.id, user.name || user.email)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
