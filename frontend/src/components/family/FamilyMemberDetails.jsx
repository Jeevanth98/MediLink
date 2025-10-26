import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';

const FamilyMemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFamilyMember = async () => {
      try {
        console.log('Loading family member with ID:', id);
        const response = await apiClient.get(`/family-members/${id}`);
        console.log('Family member details response:', response.data);
        setMember(response.data.familyMember);
      } catch (error) {
        console.error('Error loading family member:', error);
        toast.error('Failed to load family member details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFamilyMember();
    }
  }, [id, navigate]);

  const getRelationshipIcon = (relationship) => {
    const icons = {
      'Self': '👤',
      'Spouse': '💑',
      'Child': '👶',
      'Parent': '👨‍👩‍👧',
      'Sibling': '👫',
      'Grandparent': '👴',
      'Grandchild': '👶',
      'Uncle': '👨‍💼',
      'Aunt': '👩‍💼',
      'Cousin': '👫',
      'In-Law': '👨‍👩‍👧‍👦',
      'Other': '👤'
    };
    return icons[relationship] || '👤';
  };

  const getGenderIcon = (gender) => {
    if (!gender) return '⚧️';
    return gender === 'Male' ? '♂️' : gender === 'Female' ? '♀️' : '⚧️';
  };

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (category) => {
    switch (category) {
      case 'Underweight': return 'text-blue-600 bg-blue-50';
      case 'Normal': return 'text-green-600 bg-green-50';
      case 'Overweight': return 'text-yellow-600 bg-yellow-50';
      case 'Obese': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="medical-gradient min-h-100vh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-white">Loading family member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="medical-gradient min-h-100vh flex items-center justify-center">
        <div className="text-center text-white">
          <div className="medical-icon mb-4">❌</div>
          <h2 className="text-xl font-bold mb-4">Family Member Not Found</h2>
          <Link 
            to="/dashboard"
            className="btn-primary inline-block"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(member.height, member.weight);
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="medical-gradient min-h-100vh">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-medical border-b border-medical-light/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="text-medical-primary hover:text-medical-secondary transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-bold text-medical-dark">Family Member Details</h1>
              </div>
            </div>
            
            <Link
              to={`/family-member/${member.id}/edit`}
              className="bg-medical-primary text-white px-6 py-3 rounded-lg hover:bg-medical-secondary transition-colors text-sm font-bold border-2 border-medical-primary hover:border-medical-secondary"
            >
              ✏️ Edit Member
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Member Info Card */}
        <div className="bg-white rounded-2xl shadow-medical p-6 mb-6">
          {/* Header with Icon and Basic Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">
                {getRelationshipIcon(member.relationship)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-medical-dark mb-1">
                  {member.name}
                </h2>
                <div className="flex items-center space-x-4 text-medical-text">
                  <span className="flex items-center space-x-1">
                    <span>{getGenderIcon(member.gender)}</span>
                    <span>{member.gender || 'Not specified'}</span>
                  </span>
                  <span>•</span>
                  <span>{member.age} years old</span>
                  <span>•</span>
                  <span>{member.relationship}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                Basic Information
              </h3>
              
              <div className="bg-medical-light rounded-lg p-4">
                <p className="text-sm text-medical-text mb-1">Blood Group</p>
                <p className="font-semibold text-medical-dark">
                  {member.blood_group}
                </p>
              </div>

              <div className="bg-medical-light rounded-lg p-4">
                <p className="text-sm text-medical-text mb-1">Emergency Contact</p>
                <p className="font-semibold text-medical-dark">
                  {member.emergency_contact}
                </p>
              </div>

              {member.phone && (
                <div className="bg-medical-light rounded-lg p-4">
                  <p className="text-sm text-medical-text mb-1">Phone Number</p>
                  <p className="font-semibold text-medical-dark">
                    {member.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Physical Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                Physical Information
              </h3>

              {member.height && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-1">Height</p>
                  <p className="font-semibold text-blue-900">
                    {member.height} cm
                  </p>
                </div>
              )}

              {member.weight && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Weight</p>
                  <p className="font-semibold text-green-900">
                    {member.weight} kg
                  </p>
                </div>
              )}

              {bmi && (
                <div className={`rounded-lg p-4 ${getBMIColor(bmiCategory)}`}>
                  <p className="text-sm mb-1">Body Mass Index (BMI)</p>
                  <p className="font-bold text-lg">
                    {bmi}
                  </p>
                  <p className="text-sm font-medium">
                    {bmiCategory}
                  </p>
                </div>
              )}

              {!member.height && !member.weight && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm">
                    No physical measurements recorded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-medical-light">
            <div className="flex flex-wrap gap-4">
              <Link
                to={`/family-member/${member.id}/add-record`}
                className="flex-1 min-w-[250px] bg-white text-blue-600 px-6 py-4 rounded-xl font-bold text-base hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center space-x-2 shadow-md border-2 border-blue-600"
                style={{ textDecoration: 'none' }}
              >
                <span className="text-2xl">⚕️</span>
                <span>Add Medical Record</span>
              </Link>
              
              <Link
                to={`/family-member/${member.id}/records`}
                className="flex-1 min-w-[250px] bg-white text-blue-600 px-6 py-4 rounded-xl font-bold text-base hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center space-x-2 shadow-md border-2 border-blue-600"
                style={{ textDecoration: 'none' }}
              >
                <span className="text-2xl">📋</span>
                <span>View Medical History</span>
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-xs text-medical-text flex justify-between">
              <span>Added on {new Date(member.created_at).toLocaleDateString()}</span>
              {member.updated_at !== member.created_at && (
                <span>Last updated {new Date(member.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FamilyMemberDetails;