
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, CheckCircle, Vote as VoteIcon, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Safely check for admin role
  const isAdmin = userData?.role === "admin" || userData?.role === "superadmin";
  const isSuperAdmin = userData?.role === "superadmin";

  const navItems = [
    { path: "/checkin", label: "Check-In", icon: <UserCheck className="h-4 w-4" /> },
    { path: "/vote", label: "Vote", icon: <VoteIcon className="h-4 w-4" /> },
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: <CheckCircle className="h-4 w-4" /> }] : [])
  ];

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${scrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm dark:bg-gray-900/90' : 'bg-white dark:bg-gray-900'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png"
                alt="FraserVotes Logo"
                className="h-9 w-auto"
              />
              <span className="font-bold text-xl font-heading">FraserVotes</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <div className="hidden md:flex items-center mr-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 ring-2 ring-primary/20">
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
                  <div className="ml-2">
                    <p className="text-sm font-medium">{currentUser.displayName}</p>
                    <p className="text-xs text-gray-500">{userData?.role || "User"}</p>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-700 hover:text-red-600 hover:bg-red-50 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden pt-2 pb-1">
          <div className="flex justify-around">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'text-primary' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
