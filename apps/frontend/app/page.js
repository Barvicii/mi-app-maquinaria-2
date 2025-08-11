"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MachinesRegistry from '@/components/MachinesRegistry';
import LandingPage from '@/components/LandingPage';
import Layout from '@/components/Layout';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  console.log('[HOME] Session status:', status, 'User:', session?.user?.email);
  
  useEffect(() => {
    console.log('[HOME] Status changed to:', status);
    if (status === "authenticated") {
      console.log('[HOME] User authenticated:', session?.user?.email);
    } else if (status === "unauthenticated") {
      console.log('[HOME] User not authenticated');
    }
  }, [status, session]);

  // Si está cargando la sesión
  if (status === "loading") {
    console.log('[HOME] Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  // Si el usuario está autenticado, mostrar el Registro de Maquinaria con Layout, si no, mostrar la página de inicio
  if (status === "authenticated") {
    console.log('[HOME] Rendering authenticated view for:', session?.user?.email);
    return (
      <Layout>
        <MachinesRegistry />
      </Layout>
    );
  } else {
    console.log('[HOME] Rendering landing page');
    return <LandingPage />;
  }
}

