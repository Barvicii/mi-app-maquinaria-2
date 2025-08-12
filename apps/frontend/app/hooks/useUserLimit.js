import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export const useUserLimit = () => {
  const { data: session } = useSession();
  const [limitInfo, setLimitInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkUserLimit = useCallback(async (organizationId = null) => {
    try {
      setLoading(true);
      setError(null);

      // Use current user's organization if not provided - check both organizationId and organization fields
      const orgId = organizationId || session?.user?.organizationId || session?.user?.organization;
      
      console.log('🔍 Checking user limit for organization:', orgId);
      console.log('🔍 Session user role:', session?.user?.role);
      console.log('🔍 Available org fields:', {
        organizationId: session?.user?.organizationId,
        organization: session?.user?.organization,
        company: session?.user?.company
      });
      
      // Skip for super admins who don't have organizationId
      if (session?.user?.role === 'SUPER_ADMIN' && !orgId) {
        console.log('🔹 Skipping user limit check for SUPER_ADMIN without organizationId');
        return null;
      }
      
      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const response = await fetch(`/api/user-limit-check?organizationId=${orgId}`);
      const data = await response.json();
      
      console.log('📊 User limit response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check user limit');
      }

      setLimitInfo(data.organization);
      console.log('✅ Updated limitInfo:', data.organization);
      return data.organization;

    } catch (err) {
      console.error('❌ Error checking user limit:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.organizationId, session?.user?.organization]);

  // Auto-check limit when session changes
  useEffect(() => {
    console.log('🔄 useUserLimit effect triggered', {
      organizationId: session?.user?.organizationId,
      organization: session?.user?.organization,
      role: session?.user?.role,
      shouldFetch: (session?.user?.organizationId || session?.user?.organization) && (session?.user?.role === 'ADMIN' || session?.user?.role === 'USER')
    });
    
    // Only check for non-super admins with organizationId or organization
    if ((session?.user?.organizationId || session?.user?.organization) && (session?.user?.role === 'ADMIN' || session?.user?.role === 'USER')) {
      checkUserLimit();
    }
  }, [session?.user?.organizationId, session?.user?.organization, session?.user?.role, checkUserLimit]);

  return {
    limitInfo,
    loading,
    error,
    checkUserLimit,
    refetch: checkUserLimit, // Alias for manual refresh
    canAddUsers: limitInfo?.canAddUsers ?? true,
    remainingSlots: limitInfo?.remainingSlots ?? 0,
    usagePercentage: limitInfo?.usagePercentage ?? 0,
    isAtLimit: limitInfo ? limitInfo.currentUserCount >= limitInfo.maxUsers : false
  };
};
