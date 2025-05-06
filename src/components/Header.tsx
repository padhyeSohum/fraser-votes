
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";

const Header = () => {
  const { currentUser, userData, logout, canAccessCheckin, canAccessVote, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
                alt="FraserVotes Logo"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-xl">FraserVotes</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {canAccessCheckin() && (
              <Link 
                to="/checkin" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Check-In
              </Link>
            )}
            {canAccessVote() && (
              <Link 
                to="/vote" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Vote
              </Link>
            )}
            {isAdmin() && (
              <Link 
                to="/admin" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-1.5 text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    {currentUser.displayName}
                  </span>
                  {userData?.role && (
                    <span className="text-xs text-gray-500 capitalize">
                      {userData.role}
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
