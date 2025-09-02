import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../config/firebase';
import { User, AuthState } from '../types/User';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, role: 'patient' | 'caregiver' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneNumber: (confirmation: any, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
    let unsubscribe: () => void = () => {};
    
    // Initialize Firebase auth listener with error handling
    const initializeAuth = async () => {
      try {
        unsubscribe = auth().onAuthStateChanged(async (firebaseUser: any) => {
          setIsLoading(true);
          
          if (firebaseUser) {
            try {
              // Get user data from Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userProfile: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: userData?.username || firebaseUser.email?.split('@')[0] || 'User',
              phoneNumber: firebaseUser.phoneNumber || undefined,
              role: userData?.role || 'patient',
              createdAt: userData?.createdAt?.toDate() || new Date(),
              updatedAt: userData?.updatedAt?.toDate() || new Date(),
            };
            
            setUser(userProfile);
            setIsAuthenticated(true);
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('user');
      }
      
      setIsLoading(false);
    });
      } catch (error) {
        console.error('Firebase initialization error:', error);
        // Fallback: set loading to false and continue without auth
        setIsLoading(false);
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    
    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, role: 'patient' | 'caregiver' | 'admin') => {
    try {
      setIsLoading(true);
      const { user: firebaseUser } = await auth().createUserWithEmailAndPassword(email, password);
      
      // Create user document in Firestore
      await firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .set({
          email,
          role,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      
      // Send email verification
      await firebaseUser.sendEmailVerification();
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
      await auth().signInWithEmailAndPassword(email, password);
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
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    try {
      setIsLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Phone sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoneNumber = async (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => {
    try {
      setIsLoading(true);
      const credential = await confirmation.confirm(code);
      if (!credential) {
        throw new Error('Failed to confirm phone number');
      }
      const firebaseUser = credential.user;
      
      // Create or update user document in Firestore
      const userRef = firestore().collection('users').doc(firebaseUser.uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists()) {
        await userRef.set({
          phoneNumber: firebaseUser.phoneNumber,
          role: 'patient', // Default role
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Phone confirmation error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
