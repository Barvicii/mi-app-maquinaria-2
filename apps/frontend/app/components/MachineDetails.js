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
            <div>
              <span className="font-medium">Brand:</span> {machine?.brand || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Year:</span> {machine?.year || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Working Place:</span> {machine?.workPlace || 'N/A'}
            </div>
          </div>
        </div>

        {/* Filter Information Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            
            {/* Air Filter Section */}
            <div className="border-b border-gray-200 pb-3">
              <h4 className="font-medium text-gray-800 mb-2">Air Filter</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="font-medium">Type:</span> {machine?.air || 'Not configured'}
                </div>
                <div>
                  <span className="font-medium">Brand:</span> {machine?.airBrand || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Carbon Filter Section */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Carbon Filter (Chemical Equipment)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="font-medium">Type:</span> {machine?.carbon || 'Not configured'}
                </div>
                <div>
                  <span className="font-medium">Brand:</span> {machine?.carbonBrand || 'Not specified'}
                </div>
                {machine?.chemicalFilters?.hasFilters && (
                  <>
                    <div>
                      <span className="font-medium">Expected Life:</span> {machine.chemicalFilters.expectedLifeHours || 100} hours
                    </div>
                    <div>
                      <span className="font-medium">Filter Type:</span> {machine.chemicalFilters.filterType || 'Standard'}
                    </div>
                    {machine.chemicalFilters.currentFilters && machine.chemicalFilters.currentFilters.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Active Filters:</span>
                        <div className="mt-1 space-y-1">
                          {machine.chemicalFilters.currentFilters.map((filter, index) => (
                            <div key={index} className="text-sm bg-white p-2 rounded border">
                              <div>ID: {filter.filterId}</div>
                              <div>Installed: {new Date(filter.installationDate).toLocaleDateString()}</div>
                              <div>Hours Used: {filter.hoursUsed || 0}</div>
                              <div>Status: <span className={`font-medium ${filter.status === 'active' ? 'text-green-600' : filter.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {filter.status || 'active'}
                              </span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              {!machine?.chemicalFilters?.hasFilters && machine?.carbon && (
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  <span className="font-medium">Note:</span> Carbon filter is configured but not actively tracked. Enable chemical filter tracking in machine settings to monitor usage and maintenance.
                </div>
              )}
            </div>
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