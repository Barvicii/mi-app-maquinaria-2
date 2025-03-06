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
      router.push(`/service/${decodedText}`);
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