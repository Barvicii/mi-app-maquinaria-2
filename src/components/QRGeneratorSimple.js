'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Trash2 } from 'lucide-react';
import QRPrintCard from './QRPrintCard'; // Import the new component
import QRCode from 'qrcode.react';



export default function QRGeneratorSimple({ maquinas }) {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Set the base URL when the component mounts
    setBaseUrl(window.location.origin);
    
    // Fetch machines from the API instead of localStorage
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/machines');
        
        if (!response.ok) {
          throw new Error('Failed to fetch machines');
        }
        
        const data = await response.json();
        console.log('Machines loaded for QR codes:', data);
        
        // Format the machines data for QR codes
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
        
        // Fallback to localStorage only if API fails
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
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-machine-${id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getServiceUrl = (id) => {
    // Get the current window location information
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
  
    // Construct the base URL based on environment
    const baseUrl = port ? 
      `${protocol}//${hostname}:${port}` : // Development with port (e.g., localhost:3000)
      `${protocol}//${hostname}`; // Production without port
  
    console.log('Generated base URL:', baseUrl); // For debugging
    const fullUrl = `${baseUrl}/service/${id}`;
    console.log('Full service URL:', fullUrl); // For debugging
  
    return fullUrl;
  };

  const generateQRValue = (machineId) => {
    // Ensure we're using the MongoDB _id
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

      

      {selectedMachine && (
        <div className="qr-display mt-4">
          <QRCodeCanvas
            value={generateQRValue(selectedMachine)}
            size={256}
            level="H"
            includeMargin={true}
          />
          <p className="mt-2 text-sm text-gray-600">
            Machine ID: {selectedMachine}
          </p>
        </div>
      )}

      {qrCodes.length === 0 ? (
        <p className="text-center text-gray-500">No machines registered to generate QR codes.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="bg-gray-50 p-6 rounded-lg flex flex-col items-center">
              <div className="mb-4 flex justify-center">
                <QRCodeSVG
                  id={`qr-${qr.id}`}
                  value={getServiceUrl(qr.id)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-black">{qr.nombre}</h3>
                <p className="text-black">Model: {qr.modelo}</p>
                <p className="text-black">Brand: {qr.marca}</p>
                {qr.codigo && <p className="text-black">ID: {qr.codigo}</p>}
                <div className="mt-2">
                  <p className="text-sm text-gray-500 break-all">
                    URL: {getServiceUrl(qr.id)}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getServiceUrl(qr.id))
                        .then(() => alert('URL copied to clipboard'))
                        .catch(err => console.error('Error copying:', err));
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm mt-1"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
              <div className="flex justify-center space-x-2 w-full">
                <button
                  onClick={() => handleDownload(qr.id)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 flex-1"
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
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};