
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash, UserPlus, Mail, User as UserIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import SecurityKeyVerification from "@/components/admin/SecurityKeyVerification";

const UserManagement = () => {
  const { authorizedUsers, addAuthorizedUser, removeAuthorizedUser, fetchAuthorizedUsers } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isKeyVerificationOpen, setIsKeyVerificationOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
  });
  
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
  
  const handleKeyVerificationSuccess = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      if (pendingUser) {
        await addAuthorizedUser(pendingUser);
        setNewUser({ email: "", name: "" });
        setPendingUser(null);
      } else if (pendingRemoveId) {
        const userToRemove = authorizedUsers.find(u => u.id === pendingRemoveId);
        if (userToRemove) {
          await removeAuthorizedUser(pendingRemoveId);
        }
        setPendingRemoveId(null);
      }
    } catch (error: any) {
      console.error("Error managing user:", error);
      setError(error.message || "Failed to manage user");
    } finally {
      setIsLoading(false);
      setIsKeyVerificationOpen(false);
    }
  };
  
  const handleKeyVerificationCancel = () => {
    setPendingUser(null);
    setPendingRemoveId(null);
    setIsKeyVerificationOpen(false);
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
                    onClick={() => handleInitiateRemoveUser(user.id)}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SecurityKeyVerification
        open={isKeyVerificationOpen}
        onOpenChange={setIsKeyVerificationOpen}
        onSuccess={handleKeyVerificationSuccess}
        onCancel={handleKeyVerificationCancel}
      />
    </div>
  );
};

export default UserManagement;
