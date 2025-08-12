'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

const SuspensionChecker = ({ children }) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Verificar si el usuario está suspendido
      if (session.user.organizationSuspended || session.user.active === false) {
        console.log('[SUSPENSION] User or organization is suspended, signing out...');
        
        // Cerrar sesión automáticamente sin mostrar alert (mejor UX)
        signOut({ 
          callbackUrl: '/login?suspended=true',
          redirect: true 
        });
      }
    }
  }, [session, status]);

  return children;
};

export default SuspensionChecker;
