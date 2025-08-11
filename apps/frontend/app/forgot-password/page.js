'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'An error occurred while sending the reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
        style={{
          backgroundImage: `url('/Imagen/tractor-orchard.jpg'), url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay verde semi-transparente */}
        <div className="absolute inset-0 bg-green-900 bg-opacity-40"></div>
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;ve sent a password reset link to <span className="font-medium">{email}</span>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            </div>
            <div className="text-center space-y-4">
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Send another email
              </button>
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"        style={{
          backgroundImage: `url('/Imagen/tractor-orchard.jpg'), url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay verde semi-transparente */}
      <div className="absolute inset-0 bg-green-900 bg-opacity-40"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div>
            <Link
              href="/login"
              className="flex items-center text-sm text-green-600 hover:text-green-500 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
            
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
