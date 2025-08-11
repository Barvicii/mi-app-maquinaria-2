'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cambiar Contraseña</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        {success ? (
          <div className="text-green-600">
            Contraseña actualizada exitosamente. Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded">{error}</div>
            )}
            <div>
              <label className="block text-gray-600">Contraseña Actual</label>
              <input
                type="password"
                name="currentPassword"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-gray-600">Nueva Contraseña</label>
              <input
                type="password"
                name="newPassword"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-gray-600">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
