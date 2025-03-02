'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!session) return null;

  // Get first letter of email or name for avatar
  const userInitial = (session.user.name || session.user.email || '?')[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-semibold">
          {userInitial}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {session.user.name || session.user.email}
            </p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/profile');
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Mi Perfil
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/change-password');
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cambiar Contraseña
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}