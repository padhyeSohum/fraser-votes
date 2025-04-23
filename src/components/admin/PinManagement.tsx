
import { useState } from "react";
import { useElection } from "@/contexts/ElectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinAccess } from "@/types";
import { Plus, Key, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SecurityKeyVerification from "@/components/admin/SecurityKeyVerification";

const PinManagement = () => {
  const { settings, updateSettings } = useElection();
  const { toast } = useToast();
  const [isKeyVerificationOpen, setIsKeyVerificationOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'add' | 'remove' | 'toggle';
    pinId?: string;
    pinData?: Omit<PinAccess, "id" | "createdAt">;
  } | null>(null);
  
  const [newPin, setNewPin] = useState<Omit<PinAccess, "id" | "createdAt">>({
    name: "",
    pin: "",
    isActive: true
  });

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

  const handleKeyVerificationSuccess = async () => {
    if (!pendingAction) return;

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
    }

    updateSettings({
      ...settings,
      pins: updatedPins
    });

    setPendingAction(null);
    setIsKeyVerificationOpen(false);
  };

  const handleKeyVerificationCancel = () => {
    setPendingAction(null);
    setIsKeyVerificationOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PIN Management</CardTitle>
        <CardDescription>
          Add and manage PINs for voting access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
        </div>
      </CardContent>

      <SecurityKeyVerification
        open={isKeyVerificationOpen}
        onOpenChange={setIsKeyVerificationOpen}
        onSuccess={handleKeyVerificationSuccess}
        onCancel={handleKeyVerificationCancel}
      />
    </Card>
  );
};

export default PinManagement;
