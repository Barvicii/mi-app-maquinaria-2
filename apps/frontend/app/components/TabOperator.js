'use client';

import { PlusCircle } from 'lucide-react';

export default function TabOperator() {
  // Componente simplificado para mostrar "Coming Soon"

  return (
    <div className="machinary-container py-12 px-4">
      {/* Coming Soon Section */}
      <div className="flex flex-col items-center justify-start text-center max-w-4xl mx-auto">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <PlusCircle className="w-16 h-16 text-blue-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-gray-800 mb-8">
          Operator & Technician Management
        </h2>

        {/* Coming Soon Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-2xl mb-8 w-full">
          <h3 className="text-2xl font-semibold text-yellow-800 mb-4">
            🚧 Coming Soon
          </h3>
          <p className="text-yellow-700 mb-4 text-lg">
            We&apos;re working hard to bring you an amazing operator and technician management system.
          </p>
          <p className="text-yellow-600 mb-6">
            This feature will be available in a future update. Stay tuned!
          </p>
          
          {/* SOP Section */}
          <div className="bg-yellow-100 rounded-lg p-4 mt-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">
              📋 SOP Management
            </h4>
            <p className="text-yellow-700 text-sm">
              We&apos;re also developing comprehensive Standard Operating Procedures (SOPs) management to ensure proper workflow and safety protocols.
            </p>
          </div>
        </div>

        {/* Expected Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">👥 Operator Management</h4>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>• Operator registration and profiles</li>
              <li>• Certification tracking</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">🔧 Technician System</h4>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>• Technician specializations</li>
              <li>• Work assignments</li>
              <li>• Skills assessment</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">📅 Scheduling</h4>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>• Work shift management</li>
              <li>• Task scheduling</li>
              <li>• Resource allocation</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">📋 SOP Integration</h4>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>• Standard Operating Procedures</li>
              <li>• Safety protocols</li>
              <li>• Compliance tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}