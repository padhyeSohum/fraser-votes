import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

interface HeaderProps {
  hideNav?: boolean;
}

const Header = ({ hideNav = false }: HeaderProps) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Clear kiosk mode if present
      localStorage.removeItem('kioskMode');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (hideNav) {
    return null;
  }

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
            alt="FraserVotes Logo"
            className="h-8 w-auto mr-4"
          />
          <h1 className="text-lg font-semibold">FraserVotes</h1>
        </div>
        {currentUser && (
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
