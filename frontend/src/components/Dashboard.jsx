import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FamilyMemberCard from './family/FamilyMemberCard';
import { toast } from 'react-hot-toast';
import apiClient from '../utils/apiClient';
import notificationService from '../utils/notificationService';

const Dashboard = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load family members and reminders
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading dashboard data...');
        const [familyResponse, remindersResponse] = await Promise.all([
          apiClient.get('/family-members'),
          apiClient.get('/reminders')
        ]);
        
        console.log('Family members response:', familyResponse.data);
        console.log('Reminders response:', remindersResponse.data);
        
        setFamilyMembers(familyResponse.data.familyMembers || []);
        setReminders(remindersResponse.data.reminders || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        console.error('Error response:', error.response?.data);
        if (error.response?.status !== 401) {
          toast.error('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate reminder counts by type
  const medicineCount = reminders.filter(r => r.reminder_type === 'medicine').length;
  const appointmentCount = reminders.filter(r => r.reminder_type === 'appointment').length;
  const checkupCount = reminders.filter(r => r.reminder_type === 'checkup').length;

  // Start notification service when dashboard loads
  useEffect(() => {
    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
      notificationService.requestPermission().then(granted => {
        if (granted) {
          notificationService.start(apiClient);
        }
      });
    } else if (Notification.permission === 'granted') {
      notificationService.start(apiClient);
    }

    // Cleanup on unmount
    return () => {
      // Don't stop the service on unmount, keep it running
      // notificationService.stop();
    };
  }, []);

  return (
    <div className="medical-gradient min-h-100vh">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-medical border-b border-medical-light/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="medical-icon-sm mr-3">🏥</div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-medical-primary to-medical-secondary bg-clip-text text-transparent">
                MediLink
              </h1>
            </div>
            
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-medical-text hover:text-medical-dark transition-colors p-2 rounded-xl hover:bg-medical-light/10"
            >
              <div className="medical-avatar-sm">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="text-center mb-6">
          <div className="medical-icon mb-4">🎯</div>
          <h2 className="text-xl md:text-2xl font-bold text-medical-dark mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-medical-text text-sm md:text-base max-w-md mx-auto">
            Manage your family's medical records and health information in one secure place.
          </p>
        </div>

        {/* Family Members Section */}
        <div className="bg-white rounded-2xl shadow-medical border border-medical-light/20 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-medical-dark flex items-center">
                <span className="medical-icon-sm mr-2">👨‍👩‍👧‍👦</span>
                Family Members
              </h3>
              <p className="text-xs text-medical-text">Manage your family's medical records</p>
            </div>
            <Link
              to="/add-family-member"
              className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-medical-secondary transition-colors text-sm font-medium"
              style={{ textDecoration: 'none' }}
            >
              ➕ Add Member
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
              <span className="ml-3 text-medical-text">Loading family members...</span>
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="medical-icon mb-4">👨‍👩‍👧‍👦</div>
              <h4 className="font-semibold text-medical-dark mb-2">No family members added yet</h4>
              <p className="text-medical-text text-sm mb-4">
                Start by adding your first family member to manage their medical records
              </p>
              <Link
                to="/add-family-member"
                className="inline-block bg-medical-primary text-white px-6 py-3 rounded-lg hover:bg-medical-secondary transition-colors font-medium"
                style={{ textDecoration: 'none' }}
              >
                ➕ Add Your First Family Member
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <FamilyMemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>

        {/* Reminders Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-medical border-2 border-blue-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-blue-900 flex items-center">
                <span className="text-2xl mr-2">🔔</span>
                Reminders
              </h3>
              <p className="text-xs text-blue-700 mt-1">Never miss your medicine or appointments</p>
            </div>
            <Link
              to="/reminders"
              className="px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold"
              style={{ 
                textDecoration: 'none',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              Manage Reminders
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-3">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Medicine Reminders</p>
                  <p className="text-xl font-bold text-gray-900">{medicineCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-full p-3">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Appointments</p>
                  <p className="text-xl font-bold text-gray-900">{appointmentCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 rounded-full p-3">
                  <span className="text-2xl">🩺</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Checkups</p>
                  <p className="text-xl font-bold text-gray-900">{checkupCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-100 rounded-xl p-4 border border-blue-300">
            <p className="text-sm text-blue-800 flex items-center">
              <span className="mr-2">💡</span>
              <strong>Tip:</strong>&nbsp;Enable browser notifications to receive reminders even when the app is minimized!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
