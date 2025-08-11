'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Trash2, Fuel } from 'lucide-react';
import QRTankPrintCard from './QRTankPrintCard';

export default function QRTankGenerator({ tanks }) {
  const [qrTanks, setQrTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [showUrls, setShowUrls] = useState({}); // Estado para controlar qué URLs mostrar

  useEffect(() => {
    // Set the base URL when the component mounts
    setBaseUrl(window.location.origin);
    
    // Fetch tanks from the API
    const fetchTanks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/diesel-tanks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch diesel tanks');
        }
        
        const result = await response.json();
        console.log('Tanks loaded for QR codes:', result);
        
        // Format the tanks data for QR codes
        const tanks = result.tanks || [];
        setQrTanks(tanks);
        setError(null);
      } catch (error) {
        console.error('Error loading tanks for QR codes:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTanks();
  }, []);

  const handleDownload = (id) => {
    const qrElement = document.getElementById(`qr-tank-${id}`);
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-tank-${id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getTankScanUrl = (id) => {
    // Get the current window location information
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
  
    // Construct the base URL based on environment
    const baseUrl = port ? 
      `${protocol}//${hostname}:${port}` : // Development with port (e.g., localhost:3000)
      `${protocol}//${hostname}`; // Production without port
  
    console.log('Generated base URL for tank:', baseUrl); // For debugging
    const fullUrl = `${baseUrl}/diesel/scan/${id}?tank=true&public=true`;
    console.log('Full tank scan URL:', fullUrl); // For debugging
  
    return fullUrl;
  };

  const toggleUrlVisibility = (tankId) => {
    setShowUrls(prev => ({
      ...prev,
      [tankId]: !prev[tankId]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <Fuel className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading diesel tanks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && qrTanks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-gray-500">Failed to load diesel tanks for QR code generation</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-center mb-6">
        <Fuel className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-black">Diesel Tank QR Codes</h2>
      </div>

      {qrTanks.length === 0 ? (
        <div className="text-center py-12">
          <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-center text-gray-500 text-lg">No diesel tanks registered to generate QR codes.</p>
          <p className="text-center text-gray-400 text-sm mt-2">Create diesel tanks first to generate their QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {qrTanks.map((tank) => (
            <div key={tank._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-lg flex flex-col items-center max-w-md mx-auto">
              <div className="mb-3 flex justify-center">
                <QRCodeSVG
                  id={`qr-tank-${tank._id}`}
                  value={getTankScanUrl(tank._id)}
                  size={162}
                  level="H"
                  includeMargin={true}
                  fgColor="#1e40af"
                  bgColor="#ffffff"
                />
              </div>
              <div className="text-center mb-3">
                <div className="flex items-center justify-center mb-1">
                  <Fuel className="w-4 h-4 text-blue-600 mr-1" />
                  <h3 className="font-bold text-base text-black">{tank.name}</h3>
                </div>
                <p className="text-black text-sm">Capacity: {tank.capacity}L</p>
                <p className="text-black text-sm">Location: {tank.location}</p>
                {tank.description && <p className="text-gray-700 text-xs mt-1">{tank.description}</p>}
                <div className="mt-2">
                  <button
                    onClick={() => toggleUrlVisibility(tank._id)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mb-1"
                  >
                    {showUrls[tank._id] ? '🔼 Hide URL' : '🔽 Show URL'}
                  </button>
                  {showUrls[tank._id] && (
                    <div className="p-1 bg-white rounded border">
                      <p className="text-xs text-gray-600 break-all">
                        {getTankScanUrl(tank._id)}
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              await navigator.clipboard.writeText(getTankScanUrl(tank._id));
                              alert('URL copied to clipboard');
                            } else {
                              // Fallback para navegadores que no soportan clipboard API
                              const textArea = document.createElement('textarea');
                              textArea.value = getTankScanUrl(tank._id);
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              alert('URL copied to clipboard');
                            }
                          } catch (err) {
                            console.error('Error copying URL:', err);
                            alert('Could not copy URL. Please copy manually.');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
                      >
                        📋 Copy URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center space-x-1 w-full">
                <button
                  onClick={() => handleDownload(tank._id)}
                  className="px-3 py-1 bg-gray-200 text-black rounded-md hover:bg-gray-300 flex-1 text-sm"
                >
                  Download SVG
                </button>
                <QRTankPrintCard 
                  id={tank._id}
                  tankId={tank.tankId}
                  tankName={tank.name}
                  location={tank.location}
                  capacity={tank.capacity}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
