import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define the API URL
const API_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        
        // Update tokens
        localStorage.setItem('accessToken', data.accessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/user/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Define user type
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'professional' | 'admin';
  isVerified: boolean;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  registerUser: (userData: any) => Promise<void>;
  registerProfessional: (userData: any) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  loginProfessional: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Register user
  const registerUser = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.post('/auth/user/register', userData);
      
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register professional
  const registerProfessional = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.post('/auth/professional/register', userData);
      
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const loginUser = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.post('/auth/user/login', { email, password });
      
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login professional
  const loginProfessional = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.post('/auth/professional/login', { email, password });
      
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      await api.post('/auth/logout');
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        registerUser,
        registerProfessional,
        loginUser,
        loginProfessional,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export api for use in other components
export { api };