import React from 'react';
import { X, Users, AlertTriangle, Mail } from 'lucide-react';

const UserLimitModal = ({ 
  isOpen, 
  onClose, 
  limitInfo,
  organizationName = 'your organization'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              User Limit Reached
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center mb-4 p-3 bg-amber-50 rounded-lg">
            <Users className="h-5 w-5 text-amber-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Maximum Users Reached
              </p>
              <p className="text-xs text-amber-600">
                {limitInfo?.currentUserCount || 0} of {limitInfo?.maxUsers || 0} users
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You have reached the maximum number of users allowed for {organizationName}.
            </p>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                To add more users:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Remove inactive users from your organization</li>
                <li>• Contact your super administrator to increase the user limit</li>
                <li>• Upgrade your organization plan if available</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Need Help?
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Contact your super administrator or support team to request an increase 
                in your user limit.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLimitModal;
