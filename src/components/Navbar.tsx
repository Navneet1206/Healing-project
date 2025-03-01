import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <User className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">Sevayas Heals</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md hover:bg-indigo-700">Home</Link>
            
            {user ? (
              <>
                {user.role === 'user' && (
                  <Link to="/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-700">Dashboard</Link>
                )}
                
                {user.role === 'professional' && (
                  <Link to="/professional/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-700">Professional Dashboard</Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md hover:bg-indigo-700">
                    User
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link 
                      to="/user/login" 
                      className="block px-4 py-2 text-gray-800 hover:bg-indigo-100"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/user/register" 
                      className="block px-4 py-2 text-gray-800 hover:bg-indigo-100"
                    >
                      Register
                    </Link>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md hover:bg-indigo-700">
                    Professional
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link 
                      to="/professional/login" 
                      className="block px-4 py-2 text-gray-800 hover:bg-indigo-100"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/professional/register" 
                      className="block px-4 py-2 text-gray-800 hover:bg-indigo-100"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-indigo-700 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {user ? (
              <>
                {user.role === 'user' && (
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'professional' && (
                  <Link 
                    to="/professional/dashboard" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Professional Dashboard
                  </Link>
                )}
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-indigo-700 pt-2 mt-2">
                  <p className="px-3 text-sm font-semibold">User</p>
                  <Link 
                    to="/user/login" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/user/register" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
                
                <div className="border-t border-indigo-700 pt-2 mt-2">
                  <p className="px-3 text-sm font-semibold">Professional</p>
                  <Link 
                    to="/professional/login" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/professional/register" 
                    className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;