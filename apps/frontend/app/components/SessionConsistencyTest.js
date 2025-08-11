'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mapUserSessionData, getOrganizationName } from '@/utils/userDataUtils';

export default function SessionConsistencyTest() {
  const { data: session, status } = useSession();
  const [mappedData, setMappedData] = useState(null);

  useEffect(() => {
    if (session?.user) {
      // Apply our mapping function to the session data
      const mapped = mapUserSessionData(session.user);
      setMappedData(mapped);
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="p-4 bg-gray-100 rounded">Loading session data...</div>;
  }

  if (!session) {
    return <div className="p-4 bg-red-100 rounded">Not authenticated. Please sign in to test session data.</div>;
  }

  // Determine if we have field inconsistencies
  const hasCompany = !!session.user.company;
  const hasOrganization = !!session.user.organization;
  const fieldsMismatch = session.user.company !== session.user.organization;
  const organizationName = getOrganizationName(session.user);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Session Data Consistency Test</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Original Session Data</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="font-medium">Company:</span>
                <span className={!hasCompany ? "text-red-600" : ""}>{session.user.company || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Organization:</span>
                <span className={!hasOrganization ? "text-red-600" : ""}>{session.user.organization || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Are fields consistent:</span>
                <span className={fieldsMismatch ? "text-red-600" : "text-green-600"}>
                  {fieldsMismatch ? "No (mismatch)" : "Yes"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">After UserDataUtils Mapping</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="font-medium">Company:</span>
                <span className={!mappedData?.company ? "text-red-600" : ""}>{mappedData?.company || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Organization:</span>
                <span className={!mappedData?.organization ? "text-red-600" : ""}>{mappedData?.organization || '(not set)'}</span>
              </div>
              {mappedData && (
                <div className="flex justify-between">
                  <span className="font-medium">Are fields consistent:</span>
                  <span className={mappedData.company !== mappedData.organization ? "text-red-600" : "text-green-600"}>
                    {mappedData.company !== mappedData.organization ? "No (mismatch)" : "Yes"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Organization Name Display Test</h3>
        <p className="mb-2">
          <span className="font-medium">Organization name from getOrganizationName():</span>{" "}
          <span className="bg-white px-2 py-1 rounded">
            {organizationName}
          </span>
        </p>
        <p className="text-sm text-blue-600">
          This is what will be displayed in the profile and other parts of the app.
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Validation Results</h3>
        <ul className="list-disc list-inside space-y-2">
          <li className={hasCompany ? "text-green-600" : "text-red-600"}>
            Company field: {hasCompany ? "Present ✓" : "Missing ✗"}
          </li>
          <li className={hasOrganization ? "text-green-600" : "text-red-600"}>
            Organization field: {hasOrganization ? "Present ✓" : "Missing ✗"}
          </li>
          <li className={!fieldsMismatch ? "text-green-600" : "text-red-600"}>
            Field consistency: {!fieldsMismatch ? "Consistent ✓" : "Inconsistent ✗"}
          </li>
          <li className={organizationName !== 'Default' ? "text-green-600" : "text-red-600"}>
            Organization name display: {organizationName !== 'Default' ? `${organizationName} ✓` : "Default (fallback) ✗"}
          </li>
        </ul>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Raw Session Data</h3>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-xs max-h-64">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}

