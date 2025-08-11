"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MachinesRegistry from '@/components/MachinesRegistry';
import LandingPage from '@/components/LandingPage';
import Layout from '@/components/Layout';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (status === "authenticated") {
      setLoading(false);
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, router]);

  // Si está cargando la sesión
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  // Si el usuario está autenticado, mostrar el Registro de Maquinaria con Layout, si no, mostrar la página de inicio
  return status === "authenticated" ? (
    <Layout>
      <MachinesRegistry />
    </Layout>
  ) : (
    <LandingPage />
  );
}

