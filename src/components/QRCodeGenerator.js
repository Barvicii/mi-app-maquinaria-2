import QRCode from 'qrcode.react';

const QRCodeGenerator = ({ machineId }) => {
  // Create the full URL for the service page
  const serviceUrl = `${window.location.origin}/service/${machineId}`;
  
  console.log('Generated QR URL:', serviceUrl); // Debug log

  return (
    <div className="flex flex-col items-center">
      <QRCode 
        value={serviceUrl}
        size={256}
        level={'H'}
        includeMargin={true}
      />
      <p className="mt-2 text-sm text-gray-600">Machine ID: {machineId}</p>
    </div>
  );
};

export default QRCodeGenerator;