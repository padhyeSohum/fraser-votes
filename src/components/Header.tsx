
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";

const Header = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdmin = userData?.role === "admin" || userData?.role === "superadmin";

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/98dcbb62-4d86-4964-8a30-848234660652.png"
              alt="FraserVotes Logo"
              className="h-8 w-auto"
            />
            <span className="font-bold text-xl">FraserVotes</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/checkin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
            Check-In
          </Link>
          <Link to="/vote" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
            Vote
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              <div className="hidden md:flex items-center mr-2">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-1 text-gray-500" />
                  )}
                </div>
                <span className="text-sm font-medium">{currentUser.displayName}</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
