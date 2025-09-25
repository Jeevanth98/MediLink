import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';

const AddFamilyMember = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [relationshipOptions, setRelationshipOptions] = useState([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState([]);
  const navigate = useNavigate();

  // Load options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        console.log('Loading dropdown options...');
        const [relationshipsRes, bloodGroupsRes] = await Promise.all([
          apiClient.get('/family-members/relationship-options'),
          apiClient.get('/family-members/blood-group-options')
        ]);
        
        console.log('Relationships loaded:', relationshipsRes.data);
        console.log('Blood groups loaded:', bloodGroupsRes.data);
        
        setRelationshipOptions(relationshipsRes.data.relationships);
        setBloodGroupOptions(bloodGroupsRes.data.bloodGroups);
      } catch (error) {
        console.error('Error loading options:', error);
        console.error('Error response:', error.response?.data);
        toast.error('Failed to load form options');
      }
    };

    loadOptions();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('Submitting family member data:', data);
      const response = await apiClient.post('/family-members', data);
      
      console.log('Family member creation response:', response.data);
      if (response.data.familyMember) {
        toast.success('👨‍👩‍👧‍👦 Family member added successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating family member:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.error || 'Failed to add family member';
      toast.error(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-gradient min-h-100vh flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-medical w-full max-w-2xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="medical-icon mb-3">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl md:text-2xl font-bold text-medical-dark mb-2">
            Add Family Member
          </h2>
          <p className="text-medical-text text-sm">
            Add a family member to manage their medical records
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name - Required */}
            <div className="md:col-span-2">
              <label className="form-label">
                👤 Full Name *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="form-label">
                ⚧ Gender
              </label>
              <select
                {...register('gender')}
                className="form-input"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Age - Required */}
            <div>
              <label className="form-label">
                🎂 Age *
              </label>
              <input
                type="number"
                {...register('age', { 
                  required: 'Age is required',
                  min: { value: 0, message: 'Age must be 0 or greater' },
                  max: { value: 150, message: 'Age must be less than 150' }
                })}
                className={`form-input ${errors.age ? 'border-red-400' : ''}`}
                placeholder="Enter age"
              />
              {errors.age && (
                <p className="form-error">{errors.age.message}</p>
              )}
            </div>

            {/* Blood Group - Required */}
            <div>
              <label className="form-label">
                🩸 Blood Group *
              </label>
              <select
                {...register('blood_group', { required: 'Blood group is required' })}
                className={`form-input ${errors.blood_group ? 'border-red-400' : ''}`}
              >
                <option value="">Select blood group</option>
                {bloodGroupOptions.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              {errors.blood_group && (
                <p className="form-error">{errors.blood_group.message}</p>
              )}
            </div>

            {/* Relationship - Required */}
            <div>
              <label className="form-label">
                👪 Relationship *
              </label>
              <select
                {...register('relationship', { required: 'Relationship is required' })}
                className={`form-input ${errors.relationship ? 'border-red-400' : ''}`}
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map(relation => (
                  <option key={relation} value={relation}>{relation}</option>
                ))}
              </select>
              {errors.relationship && (
                <p className="form-error">{errors.relationship.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">
                📱 Phone Number
              </label>
              <input
                type="tel"
                {...register('phone', { 
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Phone number must be 10 digits'
                  }
                })}
                className={`form-input ${errors.phone ? 'border-red-400' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Emergency Contact - Required */}
            <div>
              <label className="form-label">
                🚨 Emergency Contact *
              </label>
              <input
                type="text"
                {...register('emergency_contact', { 
                  required: 'Emergency contact is required',
                  minLength: { value: 2, message: 'Emergency contact must be at least 2 characters' }
                })}
                className={`form-input ${errors.emergency_contact ? 'border-red-400' : ''}`}
                placeholder="Emergency contact name/number"
              />
              {errors.emergency_contact && (
                <p className="form-error">{errors.emergency_contact.message}</p>
              )}
            </div>

            {/* Height */}
            <div>
              <label className="form-label">
                📏 Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('height', { 
                  min: { value: 30, message: 'Height must be at least 30 cm' },
                  max: { value: 300, message: 'Height must be less than 300 cm' }
                })}
                className={`form-input ${errors.height ? 'border-red-400' : ''}`}
                placeholder="Enter height in cm"
              />
              {errors.height && (
                <p className="form-error">{errors.height.message}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="form-label">
                ⚖️ Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('weight', { 
                  min: { value: 1, message: 'Weight must be at least 1 kg' },
                  max: { value: 500, message: 'Weight must be less than 500 kg' }
                })}
                className={`form-input ${errors.weight ? 'border-red-400' : ''}`}
                placeholder="Enter weight in kg"
              />
              {errors.weight && (
                <p className="form-error">{errors.weight.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Adding Family Member...
              </span>
            ) : (
              '✨ Add Family Member'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-medical-text text-sm">
            <Link to="/dashboard" className="link-primary">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddFamilyMember;