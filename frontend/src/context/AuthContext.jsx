import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
console.log('AuthContext: axios baseURL configured as:', axios.defaults.baseURL);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data on app load
      getUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const getUserProfile = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error getting user profile:', error);
      // If token is invalid, remove it
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Frontend: Attempting login with:', { email });
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      console.log('Frontend: Login response:', response.data);
      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Frontend: Login error:', error);
      console.error('Frontend: Error response:', error.response?.data);
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const signup = async (name, email, password, phone, age) => {
    try {
      const response = await axios.post('/auth/signup', {
        name,
        email,
        password,
        phone,
        age
      });

      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data?.error || 'Signup failed';
      return { success: false, error: message };
    }
  };

  const updateProfile = async (name, email) => {
    try {
      const response = await axios.put('/auth/profile', {
        name,
        email
      });

      const { user } = response.data;
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    updateProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
