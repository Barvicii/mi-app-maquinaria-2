'use client';

import { useSession, signOut } from 'next-auth/react';
import { Ban, LogOut } from 'lucide-react';

export default function SuspendedPage() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Organization Suspended
              </h2>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-2">
                  Your organization <strong>{session?.user?.organization || session?.user?.company}</strong> has been temporarily suspended.
                </p>
                <p className="mb-4">
                  Please contact your system administrator for more information.
                </p>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                If you believe this is an error, please contact support.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
