import React from 'react';
import { Printer } from 'lucide-react';

/**
 * QR Print Card Component - Handles the printing of QR codes in a card format
 * Card dimensions: 5cm width x 7cm height
 * Styled with the Orchard Services leaf pattern background
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
              <div class="machine-id"> ${machineId || id}</div>
              <div class="company-name">Orchard Services</div>
              <div class="scan-text"> Scan for service information </div>
              <div class="footer">Designed by Barvicil Corp</div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close();
              }, 500);
            }
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
      title="Print"
    >
      <Printer className="w-4 h-4 mr-2" />
      Print
    </button>
  );
};

export default QRPrintCard;