'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Trash2 } from 'lucide-react';
import QRPrintCard from './QRPrintCard';

export default function QRGeneratorSimple({ maquinas }) {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [showUrls, setShowUrls] = useState({});

  const toggleUrlVisibility = (machineId) => {
    setShowUrls(prev => ({
      ...prev,
      [machineId]: !prev[machineId]
    }));
  };

  useEffect(() => {
    setBaseUrl(window.location.origin);
    
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/machines');
        
        if (!response.ok) {
          throw new Error('Failed to fetch machines');
        }
        
        const data = await response.json();
        console.log('Machines loaded for QR codes:', data);
        
        const codes = data.map(machine => ({
          id: machine._id,
          nombre: machine.model || machine.nombre,
          modelo: machine.model || machine.modelo,
          marca: machine.brand || machine.marca,
          codigo: machine.machineId || machine.maquinariaId
        }));
        
        setQrCodes(codes);
        setError(null);
      } catch (error) {
        console.error('Error loading machines for QR codes:', error);
        setError(error.message);
        
        try {
          const storedMaquinas = JSON.parse(localStorage.getItem('maquinas') || '[]');
          const codes = storedMaquinas.map(maquina => ({
            id: maquina.id,
            nombre: maquina.nombre || maquina.modelo,
            modelo: maquina.modelo,
            marca: maquina.marca,
            codigo: maquina.maquinariaId
          }));
          setQrCodes(codes);
        } catch (localError) {
          console.error('Also failed to load from localStorage:', localError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  const handleDelete = (id) => {
    setQrCodes(qrCodes.filter(code => code.id !== id));
  };

  const handleDownload = (id) => {
    const qrElement = document.getElementById(`qr-${id}`);
    if (!qrElement) {
      alert('QR code element not found');
      return;
    }

    const machineData = qrCodes.find(qr => qr.id === id);
    if (!machineData) {
      alert('Machine data not found');
      return;
    }

    // Create a new window for downloading (same as QRPrintCard but for PDF download)
    const downloadWindow = window.open('', '', 'height=600,width=600');
    
    // Get the QR SVG content
    const svgContent = qrElement.outerHTML;
    const machineId = machineData.codigo || machineData.id;
    
    // Use EXACTLY the same HTML and CSS as QRPrintCard
    downloadWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Download QR Card - ${machineId}</title>
          <style>
            @page {
              size: 5cm 7cm;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              width: 5cm;
              height: 7cm;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
              overflow: hidden;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .card {
              width: 5cm;
              height: 7cm;
              border: 2px solid #000;
              border-radius: 15px;
              position: relative;
              background: linear-gradient(120deg, rgba(127, 218, 212, 0.6) 0%, rgba(154, 230, 180, 0.6) 100%) !important;
              overflow: hidden;
              padding: 0.2cm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .leaf-pattern {
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 0C40 15 30 25 0 50C30 75 40 85 50 100C60 85 70 75 100 50C70 25 60 15 50 0Z" fill="white" fill-opacity="0.2"/></svg>') !important;
              background-size: 50%;
              background-position: center;
              background-repeat: no-repeat;
              z-index: 0;
              opacity: 0.3;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 4cm;
              height: 4cm;
              background: #ffffff !important;
              border: 2px solid #000;
              border-radius: 10px;
              position: relative;
              z-index: 1;
              margin: 0 auto;
              padding: 0.1cm;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .qr-container svg {
              width: 3.8cm;
              height: 3.8cm;
            }
            .info {
              text-align: center;
              position: relative;
              z-index: 1;
              width: 100%;
              margin-top: 0.3cm;
            }
            .machine-id {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 3px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .machine-id::before {
              content: '';
              display: inline-block;
              width: 5px;
              height: 5px;
              background-color: #777;
              border-radius: 50%;
              margin-right: 5px;
            }
            .machine-id::after {
              content: '';
              display: inline-block;
              width: 5px;
              height: 5px;
              background-color: #777;
              border-radius: 50%;
              margin-left: 5px;
            }
            .scan-text {
              font-size: 9px;
              font-weight: normal;
              margin-bottom: 3px;
              margin-top: 3px;
              font-style: italic;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-top: 0.2cm;
              letter-spacing: 0.5px;
            }
            .model-info {
              font-size: 9px;
              margin-top: 2px;
            }
            .footer {
              font-size: 8px;
              width: 100%;
              text-align: center;
              z-index: 1;
              margin-bottom: 2px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="leaf-pattern"></div>
            
            <div class="qr-container">
              ${svgContent}
            </div>
            
            <div class="info">
              <div class="machine-id">${machineId}</div>
              <div class="company-name">Orchard Services</div>
              <div class="scan-text">Scan for service information</div>
              <div class="footer">Designed by Barvicil Corp</div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              // Auto-open print dialog for PDF download
              setTimeout(function() {
                window.print(); 
                // Don't close automatically - let user save as PDF
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    downloadWindow.document.close();
  };

  const getServiceUrl = (id) => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
  
    const baseUrl = port ? 
      `${protocol}//${hostname}:${port}` : 
      `${protocol}//${hostname}`;
  
    const fullUrl = `${baseUrl}/service/${id}`;
    return fullUrl;
  };

  const generateQRValue = (machineId) => {
    return machineId.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">Loading machines...</p>
        </div>
      </div>
    );
  }

  if (error && qrCodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-gray-500">Failed to load machines for QR code generation</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-black mb-6 text-center">Generated QR Codes</h2>

      {qrCodes.length === 0 ? (
        <p className="text-center text-gray-500">No machines registered to generate QR codes.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="bg-white border-2 border-gray-200 p-5 rounded-lg flex flex-col items-center max-w-md mx-auto">
              <div className="mb-3 flex justify-center">
                <QRCodeSVG
                  id={`qr-${qr.id}`}
                  value={getServiceUrl(qr.id)}
                  size={162}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center mb-3">
                <h3 className="font-bold text-base text-black mb-1">{qr.nombre}</h3>
                <p className="text-black text-sm">Model: {qr.modelo}</p>
                <p className="text-black text-sm">Brand: {qr.marca}</p>
                {qr.codigo && <p className="text-black text-sm">ID: {qr.codigo}</p>}
                <div className="mt-2">
                  <button
                    onClick={() => toggleUrlVisibility(qr.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mb-1"
                  >
                    {showUrls[qr.id] ? '🔼 Hide URL' : '🔽 Show URL'}
                  </button>
                  {showUrls[qr.id] && (
                    <div className="p-1 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600 break-all">
                        {getServiceUrl(qr.id)}
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              await navigator.clipboard.writeText(getServiceUrl(qr.id));
                              alert('URL copied to clipboard');
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = getServiceUrl(qr.id);
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
                  onClick={() => handleDownload(qr.id)}
                  className="px-3 py-1 bg-gray-200 text-black rounded-md hover:bg-gray-300 flex-1 text-sm"
                >
                  Download
                </button>
                <QRPrintCard 
                  id={qr.id} 
                  machineId={qr.codigo} 
                  modelName={qr.nombre}
                  brandName={qr.marca}
                />
                <button
                  onClick={() => handleDelete(qr.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
