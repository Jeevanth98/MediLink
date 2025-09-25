import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';

const EditFamilyMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    blood_group: '',
    relationship: '',
    phone: '',
    emergency_contact: '',
    height: '',
    weight: ''
  });

  const relationshipOptions = [
    'Self', 'Spouse', 'Child', 'Parent', 'Sibling', 
    'Grandparent', 'Grandchild', 'Uncle', 'Aunt', 
    'Cousin', 'In-Law', 'Other'
  ];

  const bloodGroupOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const genderOptions = ['Male', 'Female', 'Other'];

  useEffect(() => {
    const loadFamilyMember = async () => {
      try {
        console.log('Loading family member for edit:', id);
        const response = await apiClient.get(`/family-members/${id}`);
        const member = response.data.familyMember;
        
        setFormData({
          name: member.name || '',
          gender: member.gender || '',
          age: member.age || '',
          blood_group: member.blood_group || '',
          relationship: member.relationship || '',
          phone: member.phone || '',
          emergency_contact: member.emergency_contact || '',
          height: member.height || '',
          weight: member.weight || ''
        });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.age || formData.age < 1) {
      toast.error('Please enter a valid age');
      return;
    }
    if (!formData.blood_group) {
      toast.error('Blood group is required');
      return;
    }
    if (!formData.relationship) {
      toast.error('Relationship is required');
      return;
    }
    if (!formData.emergency_contact.trim()) {
      toast.error('Emergency contact is required');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        age: parseInt(formData.age),
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };

      const response = await apiClient.put(`/family-members/${id}`, updateData);
      console.log('Family member updated:', response.data);
      
      toast.success('Family member updated successfully!');
      navigate(`/family-member/${id}`);
    } catch (error) {
      console.error('Error updating family member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update family member';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
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

  return (
    <div className="medical-gradient min-h-100vh">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-medical border-b border-medical-light/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/family-member/${id}`}
                className="text-medical-primary hover:text-medical-secondary transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-bold text-medical-dark">Edit Family Member</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-medical p-8">
          <div className="text-center mb-8">
            <div className="medical-icon mb-4">✏️</div>
            <h2 className="text-2xl font-bold text-medical-dark mb-2">Edit Family Member</h2>
            <p className="text-medical-text">Update family member information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">⚧️</span>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all bg-gray-50"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">🎂</span>
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter age"
                    min="1"
                    max="150"
                    required
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">🩸</span>
                    Blood Group *
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all bg-gray-50"
                    required
                  >
                    <option value="">Select blood group</option>
                    {bloodGroupOptions.map(bloodGroup => (
                      <option key={bloodGroup} value={bloodGroup}>{bloodGroup}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">👫</span>
                    Relationship *
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all bg-gray-50"
                    required
                  >
                    <option value="">Select relationship</option>
                    {relationshipOptions.map(relation => (
                      <option key={relation} value={relation}>{relation}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact & Physical Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                  Contact & Physical Information
                </h3>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">📱</span>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">🚨</span>
                    Emergency Contact *
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Emergency contact name/number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">📏</span>
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter height in cm"
                    min="1"
                    max="300"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3 flex items-center">
                    <span className="mr-2">⚖️</span>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter weight in kg"
                    min="1"
                    max="500"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                to={`/family-member/${id}`}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-medical-primary to-medical-secondary text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditFamilyMember;