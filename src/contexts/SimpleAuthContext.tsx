// Simple Auth Context without Firebase for demo purposes
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types/User';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, username: string, role: 'patient' | 'caregiver' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneNumber: (confirmation: any, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing user in AsyncStorage
    const checkExistingUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingUser();
  }, []);

  const signUp = async (email: string, password: string, username: string, role: 'patient' | 'caregiver' | 'admin') => {
    try {
      setIsLoading(true);
      
      // Simulate signup process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: `demo-user-${Date.now()}`,
        email,
        username,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setUser(newUser);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      console.log('Demo signup successful for:', email, 'Username:', username);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Simulate signin process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: `demo-user-signin-${Date.now()}`,
        email,
        username: email.split('@')[0], // Extract username from email for demo
        role: 'patient',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setUser(user);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Demo signin successful for:', email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('user');
      console.log('Demo signout successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    // Show demo OTP message
    console.log('📱 DEMO MODE: For testing, use OTP code "123456"');
    console.log(`Demo OTP sent to ${phoneNumber}`);
    
    // Return a mock confirmation object
    return {
      confirm: async (verificationCode: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Accept any 6-digit code for demo purposes
        if (verificationCode.length === 6) {
          const user: User = {
            id: `demo-user-phone-${Date.now()}`,
            email: `user${Date.now()}@demo.com`, // Generate demo email for phone users
            username: `user${Date.now()}`, // Generate demo username for phone users
            phoneNumber,
            role: 'patient',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setUser(user);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          console.log('Demo phone signin successful for:', phoneNumber);
          return user;
        } else {
          throw new Error('Invalid OTP format. Use any 6-digit code for demo.');
        }
      }
    };
  };

  const confirmPhoneNumber = async (confirmation: any, code: string) => {
    await confirmation.confirm(code);
  };

  const resetPassword = async (email: string) => {
    // Simulate password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Demo password reset email sent to:', email);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    signInWithPhone,
    confirmPhoneNumber,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
