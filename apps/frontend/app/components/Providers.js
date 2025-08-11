'use client';

import { SessionProvider } from "next-auth/react";
import { useEffect } from 'react';

export default function Providers({ children, session }) {
  // Verificación del entorno
  useEffect(() => {
    // Imprimir información útil en la consola para diagnóstico
    console.log('Entorno actual:', process.env.NODE_ENV);
    console.log('URL base de la aplicación:', window.location.origin);
    console.log('Session prop inicial:', session);
  }, [session]);

  return (
    <SessionProvider session={session} refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}