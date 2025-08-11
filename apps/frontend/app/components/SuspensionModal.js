'use client';

import React from 'react';
import { X, Shield, Ban, CheckCircle } from 'lucide-react';

const SuspensionModal = ({ 
  isOpen, 
  suspendingUser, 
  suspensionFormData, 
  suspensionLoading,
  onClose,
  onUpdateForm,
  onSubmit
}) => {
  if (!isOpen || !suspendingUser) return null;

  const isUnsuspending = suspendingUser.organizationSuspended;
  const organizationName = suspendingUser.company || suspendingUser.organization;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {isUnsuspending ? 'Unsuspend Organization' : 'Suspend Organization'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500"
            disabled={suspensionLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {isUnsuspending ? (
                        <>You are about to <strong>unsuspend</strong> the organization &ldquo;<strong>{organizationName}</strong>&rdquo;. All users in this organization will regain access to the system.</>
                      ) : (
                        <>You are about to <strong>suspend</strong> the organization &ldquo;<strong>{organizationName}</strong>&rdquo;. All users in this organization will be immediately logged out and unable to access the system.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!isUnsuspending && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason for Suspension <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reason"
                    value={suspensionFormData.reason}
                    onChange={(e) => onUpdateForm('reason', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    required
                    disabled={suspensionLoading}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Payment Issues">Payment Issues</option>
                    <option value="Terms of Service Violation">Terms of Service Violation</option>
                    <option value="Security Concerns">Security Concerns</option>
                    <option value="Fraudulent Activity">Fraudulent Activity</option>
                    <option value="Administrative Review">Administrative Review</option>
                    <option value="Contract Violation">Contract Violation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                    Additional Details
                  </label>
                  <textarea
                    id="details"
                    rows={3}
                    value={suspensionFormData.details}
                    onChange={(e) => onUpdateForm('details', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Provide additional context or details about the suspension..."
                    disabled={suspensionLoading}
                  />
                </div>
              </div>
            )}

            {isUnsuspending && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-700">
                  Unsuspending this organization will restore access for all users and remove any suspension restrictions.
                </p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={suspensionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={suspensionLoading || (!isUnsuspending && !suspensionFormData.reason.trim())}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isUnsuspending 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              {suspensionLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : isUnsuspending ? (
                'Unsuspend Organization'
              ) : (
                'Suspend Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspensionModal;
