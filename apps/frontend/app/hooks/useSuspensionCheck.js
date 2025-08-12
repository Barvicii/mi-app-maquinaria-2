import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export const useSuspensionCheck = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Verificar si el usuario está suspendido
      // Si organizationSuspended no existe, tratarlo como false (no suspendido)
      const isOrgSuspended = session.user.organizationSuspended === true;
      const isUserInactive = session.user.active === false;
      
      if (isOrgSuspended || isUserInactive) {
        console.log('[SUSPENSION] User or organization is suspended, signing out...');
        
        // Mostrar mensaje antes de cerrar sesión
        alert('Your account has been suspended. You will be logged out automatically.');
        
        // Cerrar sesión automáticamente
        signOut({ 
          callbackUrl: '/login?suspended=true',
          redirect: true 
        });
      }
    }
  }, [session, status]);

  return {
    isSuspended: session?.user?.organizationSuspended === true || session?.user?.active === false,
    session,
    status
  };
};

export default useSuspensionCheck;
