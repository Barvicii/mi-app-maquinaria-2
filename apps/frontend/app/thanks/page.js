'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Componente que usa useSearchParams
function ThanksContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'default';
  const machineId = searchParams.get('machineId');
  const customMessage = searchParams.get('message');
  
  // Mensajes específicos por tipo
  const getMessageByType = () => {
    if (customMessage) return customMessage;
    
    switch(type) {
      case 'service':
        return '¡Service record saved successfully!';
      case 'prestart':
        return '¡Pre-start check completed successfully!';
      default:
        return '¡Operation completed successfully!';
    }
  };
  
  const getIconByType = () => {
    switch(type) {
      case 'service':
        return '🔧';
      case 'prestart':
        return '✅';
      default:
        return '✨';
    }
  };
  
  return (
    <div className="max-w-lg mx-auto my-10 p-6 bg-white rounded-lg shadow-md text-center">
      <div className="text-6xl mb-4">{getIconByType()}</div>
      <h1 className="text-2xl font-bold mb-4 text-green-600">Submit Successful!</h1>
      <p className="mb-6 text-gray-700">{getMessageByType()}</p>
      {machineId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 mb-1">Machine:</p>
          <p className="text-lg font-semibold text-gray-800">{machineId}</p>
        </div>
      )}
      <div className="space-y-3">
        <Link href="/" className="block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
          Return to Home
        </Link>
        {type === 'service' && (
          <Link href="/dashboard" className="block bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors">
            View Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

// Página principal con Suspense
export default function ThanksPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <ThanksContent />
    </Suspense>
  );
}
