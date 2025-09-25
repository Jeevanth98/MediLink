import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, updateProfile, logout } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    const result = await updateProfile(data.name, data.email);
    
    if (result.success) {
      toast.success('✅ Profile updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('🚪 Logged out successfully');
  };

  return (
    <div className="medical-gradient min-h-100vh py-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="medical-avatar mx-auto mb-4">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || '👤'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-medical-dark">
            📋 My Profile
          </h1>
          <p className="text-medical-text text-sm mt-1">
            Manage your medical account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-medical p-6 mb-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="form-label">
                  👤 Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  disabled={!isEditing}
                  className={`form-input ${
                    !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  } ${errors.name ? 'border-red-400' : ''}`}
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                />
                {errors.name && (
                  <p className="form-error">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">
                  📧 Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  disabled={!isEditing}
                  className={`form-input ${
                    !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  } ${errors.email ? 'border-red-400' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Account Info */}
              {!isEditing && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-medical-text flex items-center">
                    📅 Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary flex-1"
                  >
                    ❌ Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary w-full"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Navigation Links */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full"
          >
            ← Back to Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors shadow-lg"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
