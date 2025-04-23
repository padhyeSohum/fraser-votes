
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Key, Plus, Trash, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { registerSecurityKey, getSecurityKeyCredentials, removeSecurityKey, SecurityKeyCredential } from "@/lib/webauthn";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SecurityKeyManagement: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [securityKeys, setSecurityKeys] = useState<SecurityKeyCredential[]>([]);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [isDeleteKeyDialogOpen, setIsDeleteKeyDialogOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      fetchSecurityKeys();
    }
  }, [currentUser]);
  
  const fetchSecurityKeys = async () => {
    if (!currentUser) return;
    
    const keys = await getSecurityKeyCredentials(currentUser.uid);
    setSecurityKeys(keys);
  };
  
  const handleAddKey = async () => {
    if (!currentUser) return;
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your security key",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const result = await registerSecurityKey(currentUser.uid, newKeyName.trim());
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Security key registered successfully",
        });
        setIsAddKeyDialogOpen(false);
        setNewKeyName("");
        fetchSecurityKeys();
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Security key registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register security key",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleDeleteKey = async () => {
    if (!selectedKeyId) return;
    
    try {
      const result = await removeSecurityKey(selectedKeyId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Security key removed successfully",
        });
        setIsDeleteKeyDialogOpen(false);
        setSelectedKeyId(null);
        fetchSecurityKeys();
      } else {
        throw new Error(result.error || 'Failed to remove key');
      }
    } catch (error: any) {
      console.error('Security key removal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove security key",
        variant: "destructive",
      });
    }
  };
  
  // Only super admins should be able to manage security keys
  if (!isSuperAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Access Restricted</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Only super administrators can manage security keys.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Security Key Management</h2>
        <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register New Security Key</DialogTitle>
              <DialogDescription>
                Register a physical security key to enable secure access to sensitive information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key-name" className="col-span-4">
                  Security Key Name
                </Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Office Security Key"
                  className="col-span-4"
                />
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Make sure your security key is connected before proceeding.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)} disabled={isRegistering}>
                Cancel
              </Button>
              <Button onClick={handleAddKey} disabled={isRegistering}>
                {isRegistering ? "Registering..." : "Register Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {securityKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No Security Keys Registered</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              You haven't registered any security keys yet. Security keys are required to access election results.
            </p>
            <Button onClick={() => setIsAddKeyDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Register New Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registered Security Keys</CardTitle>
            <CardDescription>
              Security keys that can be used to access sensitive information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-md mr-3">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{key.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Registered on {new Date(key.createdAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedKeyId(key.id);
                          setIsDeleteKeyDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Security Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this security key? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedKeyId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteKey} className="bg-red-500 hover:bg-red-600">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityKeyManagement;
