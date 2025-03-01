import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, phone: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  verifyPhone: (phone: string, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          // Fetch additional user data from our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (userError) throw userError;
          
          setUser({
            id: data.session.user.id,
            email: data.session.user.email!,
            role: userData.role,
            emailVerified: userData.email_verified,
            phoneVerified: userData.phone_verified,
            phone: userData.phone
          });
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Fetch user data when signed in
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!userError && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: userData.role,
              emailVerified: userData.email_verified,
              phoneVerified: userData.phone_verified,
              phone: userData.phone
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Fetch additional user data
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userError) throw userError;
        
        setUser({
          id: data.user.id,
          email: data.user.email!,
          role: userData.role,
          emailVerified: userData.email_verified,
          phoneVerified: userData.phone_verified,
          phone: userData.phone
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, phone: string, role: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Create user record in our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id,
              email,
              phone,
              role,
              email_verified: false,
              phone_verified: false
            }
          ]);
          
        if (insertError) throw insertError;
        
        // Send verification email (this would be handled by a server endpoint in production)
        // For now, we'll simulate this
        console.log('Verification email would be sent to:', email);
        
        // Send verification SMS (this would be handled by a server endpoint in production)
        console.log('Verification SMS would be sent to:', phone);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would verify the token with your backend
      // For now, we'll simulate a successful verification
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('id', user.id);
          
        if (error) throw error;
        
        setUser({
          ...user,
          emailVerified: true
        });
      }
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async (phone: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would verify the OTP with your backend/2Factor API
      // For now, we'll simulate a successful verification
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ phone_verified: true })
          .eq('id', user.id);
          
        if (error) throw error;
        
        setUser({
          ...user,
          phoneVerified: true
        });
      }
    } catch (err: any) {
      console.error('Phone verification error:', err);
      setError(err.message || 'Failed to verify phone');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    verifyPhone
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};