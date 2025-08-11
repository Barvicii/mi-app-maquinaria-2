'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import TabAlertas from '@/components/TabAlertas';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/roles';

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { can } = usePermissions();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Check if user has permission to view alerts
    if (status !== 'loading' && !can(PERMISSIONS.ALERTS_VIEW)) {
      router.push('/dashboard');
    }
  }, [status, router, can]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the alerts page
  if (session) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Alerts</h1>
          <TabAlertas />
        </div>
      </Layout>
    );
  }

  return null; // Don't render anything while redirecting
}
