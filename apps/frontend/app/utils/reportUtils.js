export const fetchReportsFromAPI = async (type = null) => {
  try {
    // Add cache busting parameter
    const timestamp = Date.now();
    let url = `/api/reports?_t=${timestamp}`;
    
    // Add type filter if specified
    if (type) {
      url += `&type=${type}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-store'
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status} fetching reports`);
    }
    
    const data = await response.json();
    
    // If type is specified, filter on the client side as well
    if (type && Array.isArray(data)) {
      return data.filter(report => report.type === type);
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchReportsFromAPI:', error);
    throw error;
  }
};

export const downloadReport = async (reportId, format = 'pdf') => {
  try {
    // Implementar lógica de descarga de archivos aquí
    const url = `/api/reports/file/${reportId}?format=${format}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    // Obtener el tipo de contenido de la respuesta
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // Si es JSON, podría ser un error o un URL para redireccionar
      return await response.json();
    }
    
    // Si es un archivo binario, crear un blob y url para descarga
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    return {
      isBlob: true,
      url: blobUrl,
      format: format
    };
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};