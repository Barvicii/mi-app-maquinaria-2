'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PreStartCheckForm from '@/components/PreStartCheckForm';

export default function PrestartPage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/prestart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving prestart check');
      }

      // Success - redirect to dashboard
      alert('Prestart check saved successfully');
      router.push('/');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">New Pre-Start Check</h1>
        <PreStartCheckForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}