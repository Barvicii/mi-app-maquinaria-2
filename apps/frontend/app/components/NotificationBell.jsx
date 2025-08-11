'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, Check } from 'lucide-react';
import useOutsideClick from '@/hooks/useOutsideClick';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const ref = useOutsideClick(() => {
    if (isOpen) setIsOpen(false);
  });
  
  // Cargar conteo de notificaciones no leídas al inicio
  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Actualizar cada minuto
      
      return () => clearInterval(interval);
    }
  }, [session]);
  
  // Cargar notificaciones cuando se abre el menú
  useEffect(() => {
    if (isOpen && session) {
      fetchNotifications();
    }
  }, [isOpen, session]);
  
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      
      if (!response.ok) {
        throw new Error('Error al obtener conteo de notificaciones');
      }
      
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications?limit=10');
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      // Actualizar optimistamente la UI
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      // Actualizar contador si era no leída
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Enviar actualización a la API
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });
      
      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revertir cambios optimistas en caso de error
      fetchNotifications();
      fetchUnreadCount();
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      // Actualizar optimistamente la UI
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      
      // Enviar actualización a la API
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Error al marcar todas las notificaciones como leídas');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revertir cambios optimistas en caso de error
      fetchNotifications();
      fetchUnreadCount();
    }
  };
  
  // Si no hay sesión, no mostrar nada
  if (!session) return null;
  
  return (
    <div ref={ref} className="relative">
      {/* Botón de la campana de notificaciones */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Notificaciones"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Panel desplegable de notificaciones */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
          <div className="px-4 py-3 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas como leídas
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 text-sm">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                  >
                    <div className="flex justify-between">
                      <div className="w-full">
                        {notification.actionUrl ? (
                          <Link 
                            href={notification.actionUrl}
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="block"
                          >
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          </Link>
                        ) : (
                          <>
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true,
                            locale: es
                          })}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-2 text-gray-400 hover:text-gray-500 flex-shrink-0"
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-xs text-center">
            <Link
              href="/notifications"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}