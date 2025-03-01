import React from 'react';
import { Printer } from 'lucide-react';

/**
 * QR Print Card Component - Handles the printing of QR codes in a card format
 * This can be used alongside the existing QRGeneratorSimple without modifying it
 */
const QRPrintCard = ({ id, machineId, modelName, brandName }) => {
  const getServiceUrl = (id) => {
    // Get the current window location information
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
  
    // Construct the base URL based on environment
    const baseUrl = port ? 
      `${protocol}//${hostname}:${port}` : // Development with port (e.g., localhost:3000)
      `${protocol}//${hostname}`; // Production without port
  
    const fullUrl = `${baseUrl}/service/${id}`;
    return fullUrl;
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '', 'height=600,width=600');
    
    // Get the QR code SVG element
    const qrElement = document.getElementById(`qr-${id}`);
    if (!qrElement) {
      alert('QR code element not found');
      printWindow.close();
      return;
    }
    
    // Get the QR SVG content
    const svgContent = qrElement.outerHTML;
    
    // Create the print template with the card design
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orchard Services QR Code</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            .card {
              width: 400px;
              height: 580px;
              border: 3px solid black;
              border-radius: 20px;
              padding: 15px;
              position: relative;
              background: white;
              overflow: hidden;
            }
            .background {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 0;
              opacity: 0.15;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 20px auto;
              padding: 15px;
              width: 300px;
              height: 300px;
              border: 4px solid black;
              border-radius: 15px;
              background: #f9f9f5;
              position: relative;
              z-index: 1;
            }
            .info {
              text-align: center;
              margin-top: 40px;
              position: relative;
              z-index: 1;
            }
            .machine-id {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 36px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              font-size: 14px;
              position: absolute;
              bottom: 20px;
              width: 100%;
              text-align: center;
              left: 0;
              z-index: 1;
            }
            .background-pattern {
              position: absolute;
              width: 800px;
              height: 800px;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: radial-gradient(circle, rgba(115, 212, 190, 0.1) 0%, rgba(150, 216, 142, 0.1) 100%);
              z-index: 0;
            }
            .background-pattern::before {
              content: '';
              position: absolute;
              width: 600px;
              height: 600px;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path fill="%2373D4BE" d="M100,10 C150,10 190,50 190,100 C190,150 150,190 100,190 C50,190 10,150 10,100 C10,50 50,10 100,10 Z" opacity="0.3"/></svg>');
              background-size: contain;
              background-repeat: no-repeat;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="background-pattern"></div>
            <div class="qr-container">
              ${svgContent}
            </div>
            <div class="info">
              <div class="machine-id">ID Machine: ${machineId || id}</div>
              <div class="company-name">Orchard Services</div>
            </div>
            <div class="footer">Designed by Barvicil Corp</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 flex items-center justify-center"
      title="Print Card"
    >
      <Printer className="w-4 h-4 mr-2" />
      Print Card
    </button>
  );
};

export default QRPrintCard;