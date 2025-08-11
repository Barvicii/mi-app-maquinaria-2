'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, EyeOff, Eye, Lock, Loader } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial
  
  useEffect(() => {
    // Get URL parameters
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) setToken(tokenParam);
    if (emailParam) {
      setEmail(emailParam);
    } else if (!tokenParam) {
      // If no token or email, show error
      setError('Invalid reset link. Please request a new link from the "Forgot Password" page.');
    }
    
    // Terminar el estado de carga después de procesar los parámetros
    setIsLoading(false);
  }, [searchParams]);
  
  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
    };
  };
  
  const passwordValidation = validatePassword(password);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have a token (valid link)
    if (!token) {
      setError('Reset token required. Please use the link sent to your email.');
      return;
    }
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error resetting password');
      }
      
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Updated!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password has been successfully reset. You will be redirected to the login page in a few seconds.
          </p>
          <div className="mt-6 text-center">
            <Link 
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se obtienen los parámetros
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Loader className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Loading...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Verifying reset link
          </p>
        </div>
      </div>
    );
  }

  // Mostrar página de error si no hay token
  if (!token && !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            The password reset link is invalid or has expired.
          </p>
          <div className="mt-6 text-center space-y-4">
            <Link 
              href="/forgot-password"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request New Link
            </Link>
            <div>
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create a secure password for your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => !token ? setEmail(e.target.value) : null}
                  readOnly={!!token}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                    !!token 
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder={!token ? "Enter your email address" : ""}
                />
                {!!token && (
                  <p className="mt-1 text-xs text-gray-500">
                    ℹ️ This email was verified from the reset link
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password requirements */}
              <div className="mt-2 space-y-1 text-xs">
                <p className={`${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least 8 characters
                </p>
                <p className={`${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least one uppercase letter
                </p>
                <p className={`${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least one lowercase letter
                </p>
                <p className={`${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least one number
                </p>
                <p className={`${passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                  ✓ At least one special character
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !passwordValidation.isValid || password !== confirmPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Set Password
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
