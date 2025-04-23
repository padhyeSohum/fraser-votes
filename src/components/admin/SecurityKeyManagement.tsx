
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Key, Plus, Trash, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { registerPasskey, getPasskeys, removePasskey, PasskeyCredential } from "@/lib/webauthn";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const SecurityKeyManagement: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchPasskeys();
    }
  }, [currentUser]);

  const fetchPasskeys = async () => {
    if (!currentUser) return;
    const keys = await getPasskeys(currentUser.uid);
    setPasskeys(keys);
  };

  const handleAddPasskey = async () => {
    if (!currentUser) return;
    
    setIsRegistering(true);
    try {
      const result = await registerPasskey(currentUser.uid, deviceName.trim());
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Passkey registered successfully",
        });
        setIsAddKeyDialogOpen(false);
        setDeviceName("");
        fetchPasskeys();
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register passkey",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async () => {
    if (!selectedKeyId) return;
    
    try {
      const result = await removePasskey(selectedKeyId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Passkey removed successfully",
        });
        setSelectedKeyId(null);
        fetchPasskeys();
      } else {
        throw new Error(result.error || 'Failed to remove passkey');
      }
    } catch (error: any) {
      console.error('Passkey removal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove passkey",
        variant: "destructive",
      });
    }
  };

  // Only super admins can manage passkeys
  if (!isSuperAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Access Restricted</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Only super administrators can manage passkeys.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Passkey Management</h2>
        <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Passkey
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register New Passkey</DialogTitle>
              <DialogDescription>
                Set up a passkey to enable secure access across all your devices
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-name" className="col-span-4">
                  Device Name (Optional)
                </Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro"
                  className="col-span-4"
                />
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Follow the prompts to register your passkey. This will work across all your devices.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)} disabled={isRegistering}>
                Cancel
              </Button>
              <Button onClick={handleAddPasskey} disabled={isRegistering}>
                {isRegistering ? "Registering..." : "Register Passkey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {passkeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No Passkeys Registered</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              You haven't registered any passkeys yet. Passkeys provide a secure way to access sensitive information across all your devices.
            </p>
            <Button onClick={() => setIsAddKeyDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Register Passkey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registered Passkeys</CardTitle>
            <CardDescription>
              Your registered passkeys that can be used across all your devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passkeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-md mr-3">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{key.deviceName || 'Unnamed Device'}</div>
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
                        onClick={() => setSelectedKeyId(key.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Passkey</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this passkey? You will need to register it again to use it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedKeyId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePasskey} className="bg-red-500 hover:bg-red-600">
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
