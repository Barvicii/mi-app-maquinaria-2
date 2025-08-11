'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/roles';

/**
 * Higher-Order Component que protege rutas basadas en roles de usuario
 * @param {string[]} allowedRoles - Array de roles permitidos para acceder al componente
 * @param {string} redirectTo - Ruta a la que redirigir si el usuario no tiene permiso
 */
const WithRole = (allowedRoles = [], redirectTo = '/dashboard') => {
  return function WithRoleWrapper(WrappedComponent) {
    return function WithRoleComponent(props) {
      const { data: session, status } = useSession();
      const router = useRouter();
      const [authorized, setAuthorized] = useState(false);
      const { can } = usePermissions();
      
      useEffect(() => {
        // Verificar autenticación y autorización
        if (status === 'loading') {
          // Sesión aún cargando, no hacer nada aún
          return;
        }
        
        // Si no está autenticado, redirigir a login
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Verificar si el usuario tiene alguno de los roles permitidos
        const userRole = session.user.role;
        const hasPermission = 
          allowedRoles.includes(userRole) || 
          userRole === 'SUPER_ADMIN' ||
          allowedRoles.length === 0;
        
        if (!hasPermission) {
          // Si el usuario no tiene los roles necesarios, redirigir
          router.push(redirectTo);
        } else {
          // Usuario autorizado
          setAuthorized(true);
        }
      }, [status, session, router]);
      
      // Mostrar pantalla de carga mientras verificamos permisos
      if (status === 'loading' || !authorized) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        );
      }
      
      // Si está autorizado, renderizar el componente
      return <WrappedComponent {...props} />;
    };
  };
};

export default WithRole;
