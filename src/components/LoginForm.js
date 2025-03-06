'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email');
      const password = formData.get('password');

      console.log('Attempting login with:', email);

      // Add this temporarily to your login API route to test password hashing
      const testPassword = 'yourpassword';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      console.log('Test hash:', hashedPassword);
      const isMatch = await bcrypt.compare(testPassword, hashedPassword);
      console.log('Hash test result:', isMatch);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        setError('Invalid email or password');
        return;
      }

      router.push('/dashboard');
      router.refresh();

    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* ...existing form fields... */}
      
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}