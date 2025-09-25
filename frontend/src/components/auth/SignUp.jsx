import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const SignUp = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await signup(data.name, data.email, data.password, data.phone, data.age);
      
      if (result.success) {
        toast.success('🎉 Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-gradient min-h-100vh flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-medical w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="medical-icon mb-3">🏥</div>
          <h2 className="text-xl md:text-2xl font-bold text-medical-dark mb-2">
            Create Account
          </h2>
          <p className="text-medical-text text-sm">
            Join our medical platform to manage your health records
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="form-label">
              👤 Full Name
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              className={`form-input ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">
              📧 Email Address
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`form-input ${errors.email ? 'border-red-400' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
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
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone number must be 10 digits'
                }
              })}
              className={`form-input ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="Enter 10-digit phone number"
            />
            {errors.phone && (
              <p className="form-error">{errors.phone.message}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="form-label">
              🎂 Age
            </label>
            <input
              type="number"
              {...register('age', { 
                required: 'Age is required',
                min: { value: 1, message: 'Age must be at least 1' },
                max: { value: 120, message: 'Age must be less than 120' }
              })}
              className={`form-input ${errors.age ? 'border-red-400' : ''}`}
              placeholder="Enter your age"
            />
            {errors.age && (
              <p className="form-error">{errors.age.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="form-label">
              🔒 Password
            </label>
            <input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className={`form-input ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Create a strong password"
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label">
              🔒 Confirm Password
            </label>
            <input
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              className={`form-input ${errors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Creating Account...
              </span>
            ) : (
              '🎯 Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-medical-text text-sm">
            Already have an account?{' '}
            <Link to="/login" className="link-primary">
              Sign in here 🚀
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
