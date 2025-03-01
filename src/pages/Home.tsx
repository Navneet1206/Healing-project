import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Users } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Secure Authentication System</h1>
        <p className="text-xl text-gray-600">
          A complete MERN stack authentication solution with separate user and professional accounts.
        </p>
      </div>

      {user ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <User className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold">Welcome, {user.firstName}!</h2>
          </div>
          <p className="text-gray-600 mb-4">
            You are logged in as a <span className="font-semibold">{user.role}</span>.
          </p>
          <div className="mt-6">
            {user.role === 'user' && (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            )}
            {user.role === 'professional' && (
              <Link
                to="/professional/dashboard"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Go to Professional Dashboard
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-semibold">User Account</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Register or login as a regular user to access our services.
            </p>
            <div className="flex space-x-4 mt-6">
              <Link
                to="/user/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Login
              </Link>
              <Link
                to="/user/register"
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50"
              >
                Register
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-semibold">Professional Account</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Register or login as a professional to offer your services.
            </p>
            <div className="flex space-x-4 mt-6">
              <Link
                to="/professional/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Login
              </Link>
              <Link
                to="/professional/register"
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Secure Authentication</h3>
            </div>
            <p className="text-gray-600">
              JWT-based authentication with access and refresh tokens for enhanced security.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <User className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">User Accounts</h3>
            </div>
            <p className="text-gray-600">
              Dedicated registration and login flows for regular users.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Professional Accounts</h3>
            </div>
            <p className="text-gray-600">
              Specialized registration and login for professionals with additional profile details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;