import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="text-center p-12 bg-gray-50 rounded-lg">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">No reports available</h3>
      <p className="mt-1 text-gray-500">Create a new report using the button above.</p>
    </div>
  );
};

export default EmptyState;