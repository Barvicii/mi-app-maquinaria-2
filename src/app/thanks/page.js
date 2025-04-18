'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Componente que usa useSearchParams
function ThanksContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'default';
  const message = searchParams.get('message') || '¡Operación completada con éxito!';
  
  return (
    <div className="max-w-lg mx-auto my-10 p-6 bg-white rounded-lg shadow-md text-center">
      <h1 className="text-2xl font-bold mb-4">¡Gracias!</h1>
      <p className="mb-6">{message}</p>
      <Link href="/" className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
        Volver al inicio
      </Link>
    </div>
  );
}

// Página principal con Suspense
export default function ThanksPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Cargando...</div>}>
      <ThanksContent />
    </Suspense>
  );
}