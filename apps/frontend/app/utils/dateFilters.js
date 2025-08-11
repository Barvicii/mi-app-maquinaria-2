/**
 * Utilidades para el filtrado de fechas en reportes y consultas
 * Este archivo contiene funciones mejoradas para procesar y filtrar fechas en diferentes formatos
 */

/**
 * Verifica si una fecha está dentro de un rango dado.
 * Mejora la detección de fechas en diferentes formatos y agrega logging detallado.
 * 
 * @param {Date|string} dateValue - El valor de fecha a comprobar
 * @param {Date|null} fromDate - Fecha de inicio del rango (opcional)
 * @param {Date|null} toDate - Fecha de fin del rango (opcional)
 * @returns {boolean} - true si la fecha está en el rango, false en caso contrario
 */
export function isDateInRange(dateValue, fromDate, toDate) {
  if (!dateValue) {
    console.log(`[DATE_FILTER] Valor de fecha nulo o indefinido`);
    return false;
  }
  
  let dateObj;
  
  // Convertir diferentes tipos de datos a objeto Date
  if (typeof dateValue === 'string') {
    try {
      // Intentar formato ISO estándar primero (YYYY-MM-DDTHH:MM:SS.sssZ)
      dateObj = new Date(dateValue);
      
      // Verificar si la conversión fue exitosa
      if (isNaN(dateObj.getTime())) {
        console.log(`[DATE_FILTER] Error al convertir fecha string: "${dateValue}"`);
        return false;
      }
      
      console.log(`[DATE_FILTER] Fecha string convertida: "${dateValue}" -> ${dateObj.toISOString()}`);
    } catch (e) {
      console.log(`[DATE_FILTER] Excepción al convertir fecha string: "${dateValue}"`, e);
      return false;
    }
  } else if (dateValue instanceof Date) {
    dateObj = dateValue;
    
    // Verificar que sea una fecha válida
    if (isNaN(dateObj.getTime())) {
      console.log(`[DATE_FILTER] Objeto Date inválido`);
      return false;
    }
    
    console.log(`[DATE_FILTER] Usando objeto Date: ${dateObj.toISOString()}`);
  } else {
    console.log(`[DATE_FILTER] Tipo de fecha no soportado: ${typeof dateValue}`);
    return false;
  }
  
  // Comprobar si está dentro del rango
  let result = false;
  
  if (fromDate && toDate) {
    result = dateObj >= fromDate && dateObj <= toDate;
    console.log(`[DATE_FILTER] Comprobando rango completo: ${fromDate.toISOString()} <= ${dateObj.toISOString()} <= ${toDate.toISOString()} = ${result}`);
  } else if (fromDate) {
    result = dateObj >= fromDate;
    console.log(`[DATE_FILTER] Comprobando fecha desde: ${dateObj.toISOString()} >= ${fromDate.toISOString()} = ${result}`);
  } else if (toDate) {
    result = dateObj <= toDate;
    console.log(`[DATE_FILTER] Comprobando fecha hasta: ${dateObj.toISOString()} <= ${toDate.toISOString()} = ${result}`);
  } else {
    // Sin filtros de fecha
    result = true;
    console.log(`[DATE_FILTER] Sin filtros de fecha aplicados`);
  }
  
  return result;
}

/**
 * Crea una consulta MongoDB para filtrar por fechas en múltiples campos
 * @param {object} baseQuery - Consulta base (sin filtros de fecha)
 * @param {Date|string|null} dateFrom - Fecha de inicio (opcional)
 * @param {Date|string|null} dateTo - Fecha de fin (opcional) 
 * @param {string[]} dateFields - Campos de fecha a filtrar (por defecto: ['fecha', 'createdAt', 'datos.fecha'])
 * @returns {object} - Consulta MongoDB con filtros de fecha
 */
export function createDateFilterQuery(baseQuery, dateFrom, dateTo, dateFields = ['fecha', 'createdAt', 'datos.fecha']) {
  // Si no hay filtros de fecha, devolver la consulta base
  if (!dateFrom && !dateTo) {
    return baseQuery;
  }
  
  // Preparar objetos de fechas
  let fromDate = null;
  let toDate = null;
  
  if (dateFrom) {
    fromDate = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0); // Inicio del día
    console.log(`[DATE_FILTER] Fecha desde configurada: ${fromDate.toISOString()}`);
  }
  
  if (dateTo) {
    toDate = dateTo instanceof Date ? dateTo : new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // Fin del día
    console.log(`[DATE_FILTER] Fecha hasta configurada: ${toDate.toISOString()}`);
  }
  
  // Crear condiciones OR para diferentes campos de fecha
  const dateConditions = [];
  
  // Para cada campo de fecha, crear condiciones tanto para formato Date como String
  dateFields.forEach(field => {
    // Condición para campo de tipo Date
    if (fromDate && toDate) {
      dateConditions.push({ [field]: { $gte: fromDate, $lte: toDate } });
    } else if (fromDate) {
      dateConditions.push({ [field]: { $gte: fromDate } });
    } else if (toDate) {
      dateConditions.push({ [field]: { $lte: toDate } });
    }
    
    // Condición para campo de tipo String (formato ISO)
    if (fromDate && toDate) {
      dateConditions.push({ [field]: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() } });
    } else if (fromDate) {
      dateConditions.push({ [field]: { $gte: fromDate.toISOString() } });
    } else if (toDate) {
      dateConditions.push({ [field]: { $lte: toDate.toISOString() } });
    }
  });
  
  // Combinar con la consulta base
  return {
    $and: [
      baseQuery,
      { $or: dateConditions }
    ]
  };
}

// Para mantener compatibilidad con código existente que use CommonJS
// Exportamos también como objeto para module.exports
const dateFilters = {
  isDateInRange,
  isDateInRangeImproved: isDateInRange, // Alias para compatibilidad
  createDateFilterQuery
};

export default dateFilters;
