import QRCodePrint from './QRCodePrint';

// In your component
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