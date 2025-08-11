'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¡Solicitud Enviada!
            </h2>
            
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>
                Tu solicitud de acceso ha sido enviada exitosamente.
              </p>
              <p>
                Recibirás un correo electrónico cuando un administrador revise y apruebe tu solicitud.
              </p>
              <p className="font-medium">
                Este proceso puede tomar entre 24-48 horas.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">¿Qué sigue?</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Espera la aprobación del administrador</li>
                    <li>Recibirás credenciales por correo</li>
                    <li>Podrás acceder al sistema</li>
                  </ul>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
