import React from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

const SessionSecurityInfo = () => {
  const { data: session } = useSession();

  if (!session) return null;

  const isExtendedSession = session.user?.rememberMe;
  const expiresAt = session.expires ? new Date(session.expires) : null;

  return (
    <div className="mb-4">
      <div className={`rounded-lg border p-3 ${
        isExtendedSession 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isExtendedSession ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Extended Session Active
              </span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Standard Session
              </span>
            </>
          )}
        </div>
        
        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          <span>
            {isExtendedSession 
              ? 'Session expires in 30 days for convenience' 
              : 'Session expires in 24 hours for security'
            }
          </span>
        </div>
        
        {expiresAt && (
          <div className="mt-1 text-xs text-gray-500">
            Expires: {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
          </div>
        )}
        
        {isExtendedSession && (
          <div className="mt-2 text-xs text-amber-700">
            ⚠️ For security, sign out when using shared devices
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSecurityInfo;
