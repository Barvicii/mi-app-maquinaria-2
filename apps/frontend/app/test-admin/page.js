"use client";

import { useSession } from 'next-auth/react';

export default function TestAdminPage() {
  const { data: session, status } = useSession();
  
  console.log('🧪 TEST PAGE - Status:', status);
  console.log('🧪 TEST PAGE - Session:', session);
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-6">
          ✅ TEST PAGE - Esta página SÍ funciona!
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <strong>Session Status:</strong> {status}
          </div>
          <div>
            <strong>User Name:</strong> {session?.user?.name || 'No definido'}
          </div>
          <div>
            <strong>User Email:</strong> {session?.user?.email || 'No definido'}
          </div>
          <div>
            <strong>User Role:</strong> {session?.user?.role || 'No definido'}
          </div>
          <div>
            <strong>User ID:</strong> {session?.user?.id || 'No definido'}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-bold text-blue-800">🎯 Información de Debug:</h2>
            <p className="text-blue-700 mt-2">
              Si puedes ver esta página correctamente, significa que:
            </p>
            <ul className="list-disc list-inside text-blue-600 mt-2 space-y-1">
              <li>Next.js está funcionando</li>
              <li>NextAuth está funcionando</li>
              <li>Las rutas dinámicas funcionan</li>
              <li>Los componentes React se renderizan</li>
            </ul>
          </div>
          
          <div className="mt-4">
            <a 
              href="/admin/reports" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Ir a Admin Reports
            </a>
            <a 
              href="/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4"
            >
              Ir a Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
