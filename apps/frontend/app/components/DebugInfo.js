'use client';

import { useState } from 'react';

export default function DebugInfo({ info }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 text-white px-4 py-2 rounded-md"
      >
        {isOpen ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {isOpen && (
        <div className="mt-2 p-4 bg-black text-white rounded-md max-w-lg max-h-96 overflow-auto">
          <h3 className="text-lg font-bold">Debug Info</h3>
          <pre className="text-xs mt-2">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}