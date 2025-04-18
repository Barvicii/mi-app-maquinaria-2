'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useSession } from 'next-auth/react';

export default function QRScanner() {
  const router = useRouter();
  const { data: session } = useSession();
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    setScanner(qrScanner);

    qrScanner.render(async (decodedText) => {
      console.log('QR Code decoded:', decodedText);
      
      // Extraer el ID de la máquina del texto decodificado
      let machineId = decodedText;
      
      // Si es una URL completa, extraer el ID
      if (decodedText.includes('/')) {
        try {
          const parts = decodedText.split('/');
          machineId = parts[parts.length - 1];
          
          // Limpiar cualquier parámetro de URL
          if (machineId.includes('?')) {
            machineId = machineId.split('?')[0];
          }
        } catch (error) {
          console.error('Error parsing QR URL:', error);
        }
      }
      
      // IMPORTANTE: Siempre incluir public=true en la navegación
      router.push(`/service/${machineId}?public=true`);
    }, (error) => {
      console.warn('QR Scan error:', error);
    });

    return () => {
      if (qrScanner) {
        qrScanner.clear();
      }
    };
  }, [router]);

  return (
    <div className="qr-scanner-container">
      {error && (
        <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      <div id="reader"></div>
    </div>
  );
}