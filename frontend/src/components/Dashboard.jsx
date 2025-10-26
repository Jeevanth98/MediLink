import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FamilyMemberCard from './family/FamilyMemberCard';
import { toast } from 'react-hot-toast';
import apiClient from '../utils/apiClient';

const Dashboard = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load family members
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        console.log('Loading family members...');
        const response = await apiClient.get('/family-members');
        console.log('Family members response:', response.data);
        setFamilyMembers(response.data.familyMembers || []);
      } catch (error) {
        console.error('Error loading family members:', error);
        console.error('Error response:', error.response?.data);
        if (error.response?.status !== 401) {
          toast.error('Failed to load family members');
        }
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-medical p-4 border border-medical-light/20">
            <div className="text-center">
              <div className="medical-icon-sm mb-2">👨‍👩‍👧‍👦</div>
              <p className="text-xs text-medical-text mb-1">Family Members</p>
              <p className="text-xl font-bold text-medical-dark">{familyMembers.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-medical p-4 border border-medical-light/20">
            <div className="text-center">
              <div className="medical-icon-sm mb-2">📋</div>
              <p className="text-xs text-medical-text mb-1">Documents</p>
              <p className="text-xl font-bold text-medical-dark">0</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-medical p-4 border border-medical-light/20">
            <div className="text-center">
              <div className="medical-icon-sm mb-2">⏰</div>
              <p className="text-xs text-medical-text mb-1">Reminders</p>
              <p className="text-xl font-bold text-medical-dark">0</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-medical p-4 border border-medical-light/20">
            <div className="text-center">
              <div className="medical-icon-sm mb-2">🤖</div>
              <p className="text-xs text-medical-text mb-1">AI Insights</p>
              <p className="text-xl font-bold text-medical-dark">0</p>
            </div>
          </div>
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
      </main>
    </div>
  );
};

export default Dashboard;
