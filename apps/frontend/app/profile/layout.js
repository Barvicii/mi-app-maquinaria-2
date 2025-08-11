'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, ArrowLeft } from 'lucide-react';

export default function ProfileLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <Link href="/" className="flex items-center text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center">
              {session && session.user && (
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="ml-2 text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}
