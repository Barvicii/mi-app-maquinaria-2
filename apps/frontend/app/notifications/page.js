'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Bell, Check, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  
  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Cargar notificaciones
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, pagination.offset, pagination.limit, filter]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir URL con parámetros de paginación y filtro
      let url = `/api/notifications?limit=${pagination.limit}&offset=${pagination.offset}`;
      
      if (filter === 'unread') {
        url += '&unread=true';
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        hasMore: data.pagination.hasMore
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('No se pudieron cargar las notificaciones. Por favor, inténtelo de nuevo.');
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
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      // Actualizar optimistamente la UI
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
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
    }
  };
  
  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };
  
  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };
  
  // Obtener el tipo de indicador basado en el tipo de notificación
  const getNotificationIndicator = (type) => {
    switch (type) {
      case 'request':
        return 'bg-blue-500';
      case 'approval':
        return 'bg-green-500';
      case 'rejection':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-gray-500';
      default:
        return 'bg-indigo-500';
    }
  };
  
  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Si no está autenticado, no mostrar nada (será redirigido)
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <Layout>
      <Layout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Notificaciones
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Todas las notificaciones y alertas del sistema
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>
          
          {/* Filtros */}
          <div className="mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  filter === 'unread'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                No leídas
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                  filter === 'read'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Leídas
              </button>
            </div>
          </div>
          
          {/* Lista de notificaciones */}
          <div className="bg-white shadow overflow-hidden rounded-md">
            {loading && notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-4 text-red-500">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Intentar de nuevo
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="mx-auto h-16 w-16 text-gray-300" />
                <p className="mt-4 text-gray-500">No tienes notificaciones{filter !== 'all' ? ' con este filtro' : ''}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${notification.read ? '' : 'bg-blue-50'}`}
                  >
                    <div className="flex items-start">
                      <div className={`mr-4 mt-1 flex-shrink-0 h-3 w-3 rounded-full ${getNotificationIndicator(notification.type)}`}></div>
                      <div className="min-w-0 flex-1">
                        {notification.actionUrl ? (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="block focus:outline-none"
                          >
                            <div>
                              <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div>
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        )}
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-xs text-gray-400">
                            {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')} · 
                            <span className="ml-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true,
                                locale: es
                              })}
                            </span>
                          </div>
                          
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Paginación */}
            {!loading && !error && notifications.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.offset === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      !pagination.hasMore 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{Math.min(pagination.offset + 1, pagination.total)}</span> a <span className="font-medium">{Math.min(pagination.offset + notifications.length, pagination.total)}</span> de <span className="font-medium">{pagination.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={pagination.offset === 0}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.offset === 0 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.hasMore}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          !pagination.hasMore 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
    </Layout>
  );
}

