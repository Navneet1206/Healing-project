import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { RegisterFormData } from '../types';
import { UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const { registerUser, registerProfessional, loading, error } = useAuth();
  const navigate = useNavigate();
  const { register: registerField, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const [role, setRole] = useState<'user' | 'professional'>('user');

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (role === 'user') {
        await registerUser({
          email: data.email,
          password: data.password,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone,
        });
      } else {
        await registerProfessional({
          email: data.email,
          password: data.password,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          specialization: data.specialization || '', // Add these fields to your form if needed
          licenseNumber: data.licenseNumber || '',
          yearsOfExperience: data.yearsOfExperience || 0,
          bio: data.bio || '',
          phone: data.phone,
        });
      }
      navigate('/verify');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-full">
            <UserPlus className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  {...registerField('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  {...registerField('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  {...registerField('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
                    }
                  })}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  {...registerField('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'The passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Additional fields for professionals */}
            {role === 'professional' && (
              <>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Specialization
                  </label>
                  <div className="mt-1">
                    <input
                      id="specialization"
                      type="text"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...registerField('specialization', { required: 'Specialization is required' })}
                    />
                    {errors.specialization && (
                      <p className="mt-2 text-sm text-red-600">{errors.specialization.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="licenseNumber"
                      type="text"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...registerField('licenseNumber', { required: 'License number is required' })}
                    />
                    {errors.licenseNumber && (
                      <p className="mt-2 text-sm text-red-600">{errors.licenseNumber.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <div className="mt-1">
                    <input
                      id="yearsOfExperience"
                      type="number"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...registerField('yearsOfExperience', { 
                        required: 'Years of experience is required',
                        min: { value: 0, message: 'Years of experience cannot be negative' }
                      })}
                    />
                    {errors.yearsOfExperience && (
                      <p className="mt-2 text-sm text-red-600">{errors.yearsOfExperience.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...registerField('bio', { required: 'Bio is required' })}
                    />
                    {errors.bio && (
                      <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am registering as a:
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="user-role"
                    name="role"
                    type="radio"
                    checked={role === 'user'}
                    onChange={() => setRole('user')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="user-role" className="ml-2 block text-sm text-gray-900">
                    User
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="professional-role"
                    name="role"
                    type="radio"
                    checked={role === 'professional'}
                    onChange={() => setRole('professional')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="professional-role" className="ml-2 block text-sm text-gray-900">
                    Professional
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;