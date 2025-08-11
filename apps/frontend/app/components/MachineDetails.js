import QRCodePrint from './QRCodePrint';

const MachineDetails = ({ machine }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Machine Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <span className="font-medium">Custom ID:</span> {machine?.customId || 'N/A'}
            </div>
            <div>
              <span className="font-medium">System ID:</span> {machine?._id || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Model:</span> {machine?.model || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Serial Number:</span> {machine?.serialNumber || 'N/A'}
            </div>
            {/* Add any additional machine details you want to display */}
          </div>
        </div>
      </div>
    </div>
  );
};

const handlePrint = () => {
  const url = `${window.location.origin}/service/${machine._id}`;
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Code</title>
        <link href="${window.location.origin}/styles/globals.css" rel="stylesheet">
      </head>
      <body>
        <div id="print-content">
          ${ReactDOMServer.renderToString(
            <QRCodePrint url={url} machineData={machine} />
          )}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

export default MachineDetails;