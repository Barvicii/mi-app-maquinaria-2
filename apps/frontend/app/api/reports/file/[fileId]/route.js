import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { isDateInRange } from '@/utils/dateFilters';

export async function GET(request, { params }) {
  try {
    const fileId = params.fileId;
    console.log('[API] Report file requested:', fileId);

    // Verificar sesión de usuario (opcional)
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('[API] No valid session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Conectar a base de datos
    const db = await connectDB();
    
    if (!db) {
      console.error('[API] Database connection failed');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Buscar el reporte basado en el fileId
    console.log(`[API] Looking for report with fileUrl: /api/reports/file/${fileId}`);
    const report = await db.collection('reports').findOne({
      fileUrl: `/api/reports/file/${fileId}`
    });
    
    if (!report) {
      console.error(`[API] Report not found for file ID: ${fileId}`);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    console.log(`[API] Found report: ${report._id}, type: ${report.type}`);
    
    // Generar contenido CSV basado en el tipo de reporte
    let csvContent;    if (report.type === 'service' || report.type === 'services') {
      // NUEVO ENFOQUE: Cargar todos los datos del usuario y filtrar después
      // Consulta base: solo filtramos por userId
      const query = { userId: session.user.id };
      
      console.log(`[API] Consultando servicios con userId: ${session.user.id}`);
      
      // Si hay filtro de máquina, agregarlo
      if (report.machineId) {
        query.$or = [
          { machineId: report.machineId },
          { 'datos.machineId': report.machineId },
          { maquinaId: report.machineId },
          { customMachineId: report.machineId }
        ];
      }
      
      if (report.machineId) {
        query.$or = [
          { machineId: report.machineId },
          { 'datos.machineId': report.machineId },
          { maquinaId: report.machineId },
          { customMachineId: report.machineId }
        ];
      }
      
      console.log(`[API] Services query:`, JSON.stringify(query));
      
      // Obtener los servicios
      const services = await db.collection('services')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
        console.log(`[API] Found ${services.length} services for user before filtering`);
      
      // FILTRAR POR FECHA MANUALMENTE
      let filteredServices = [...services];        // Preparar fechas si hay filtros
      if (report.dateFrom || report.dateTo) {
        console.log(`[API] Filtrando servicios por fecha: desde=${report.dateFrom || 'N/A'}, hasta=${report.dateTo || 'N/A'}`);
        
        const fromDate = report.dateFrom ? new Date(report.dateFrom) : null;
        const toDate = report.dateTo ? new Date(report.dateTo) : null;
        
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          console.log(`[API] Fecha fin configurada como: ${toDate.toISOString()}`);
        }
        
        // Filtrar servicios por fecha usando la función global
        filteredServices = filteredServices.filter(service => {
          // Intentar con diferentes campos de fecha
          return isDateInRange(service.fecha, fromDate, toDate) || 
                 isDateInRange(service.createdAt, fromDate, toDate) || 
                 (service.datos && isDateInRange(service.datos.fecha, fromDate, toDate));
        });
        
        console.log(`[API] Después de filtrar por fecha: ${filteredServices.length} servicios`);
      }
      
      // Generar CSV con los datos filtrados
      csvContent = generateServicesCsv(filteredServices);} else if (report.type === 'prestart') {
      // NUEVO ENFOQUE: Cargar todos los datos del usuario y filtrar después
      // Consulta base: solo filtramos por userId
      const query = { userId: session.user.id };
      
      console.log(`[API] Consultando prestarts con userId: ${session.user.id}`);
      
      // Si hay filtro de máquina, agregarlo
      if (report.machineId) {
        query.$or = [
          { machineId: report.machineId },
          { maquinaId: report.machineId }
        ];
      }
      
      if (report.machineId) {
        query.$or = [
          { machineId: report.machineId },
          { maquinaId: report.machineId },
          { 'datos.machineId': report.machineId },
          { 'datos.maquinaId': report.machineId },
          { customMachineId: report.machineId }
        ];
      }
      
      const prestarts = await db.collection('prestart')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
        console.log(`[API] Found ${prestarts.length} prestart records before filtering`);
      
      // Obtener primer registro para debugging
      if (prestarts.length > 0) {
        console.log(`[API] Sample prestart record:`, JSON.stringify(prestarts[0]));
      }
      
      // FILTRAR POR FECHA MANUALMENTE
      let filteredPrestarts = [...prestarts];
        // Preparar fechas si hay filtros
      if (report.dateFrom || report.dateTo) {
        console.log(`[API] Filtrando prestarts por fecha: desde=${report.dateFrom || 'N/A'}, hasta=${report.dateTo || 'N/A'}`);
        
        const fromDate = report.dateFrom ? new Date(report.dateFrom) : null;
        const toDate = report.dateTo ? new Date(report.dateTo) : null;
        
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          console.log(`[API] Fecha fin configurada como: ${toDate.toISOString()}`);
        }
        
        // Filtrar prestarts por fecha usando la función global
        filteredPrestarts = filteredPrestarts.filter(prestart => {
          // Intentar con diferentes campos de fecha
          return isDateInRange(prestart.fecha, fromDate, toDate) || 
                 isDateInRange(prestart.createdAt, fromDate, toDate) || 
                 (prestart.datos && isDateInRange(prestart.datos.fecha, fromDate, toDate));
        });
        
        console.log(`[API] Después de filtrar por fecha: ${filteredPrestarts.length} prestarts`);
      }
      
      csvContent = generatePrestartCsv(filteredPrestarts);
    } else {
      csvContent = "No data available for this report type";
    }    // Si el archivo está vacío o solo tiene la línea de cabecera, generar contenido por defecto
    if (!csvContent || csvContent === 'No data available' || csvContent.split('\n').length <= 1) {
      csvContent = `REPORTE SIN DATOS PARA LOS FILTROS SELECCIONADOS\n\n`;
      csvContent += `Tipo de reporte: ${report.type}\n`;
      csvContent += `Rango de fechas: ${report.dateFrom ? new Date(report.dateFrom).toLocaleDateString() : 'Todos'} - ${report.dateTo ? new Date(report.dateTo).toLocaleDateString() : 'Todos'}\n`;
      csvContent += `Filtro de máquina: ${report.machineId || 'Todas'}\n`;
      csvContent += `Generado: ${new Date().toLocaleString()}\n\n`;
      csvContent += `Nota: Si está utilizando filtros de fecha, intente ampliar el rango de fechas o verifique que existan datos para ese período.`;
    }
    
    console.log(`[API] Generated CSV with ${csvContent.split('\n').length} lines`);
    
    // Crear nombre de archivo con fecha
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `${report.type || 'report'}_${currentDate}_${fileId}.csv`;
    
    // Devolver el CSV como descarga
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
    
  } catch (error) {
    console.error('[API] Error generating report file:', error);
    return NextResponse.json({ error: error.message || 'Error generating file' }, { status: 500 });
  }
}

// Función para generar CSV de servicios
function generateServicesCsv(services) {
  if (!services || services.length === 0) {
    return 'No data available';
  }
  
  try {
    // Definir encabezados según formato solicitado
    const headers = [
      'Created Date',
      'Machine ID',
      'Technician', 
      'Machine Hours', 
      'Hours Next Service',
      'Work Performed', 
      'Parts Used', 
      'Observations',
      'Created By'
    ];
      // Función para obtener datos de forma segura
    const getProperty = (service, property) => {
      // Buscar directamente en el servicio
      if (service[property] !== undefined) {
        return service[property];
      }
      
      // Buscar en el objeto datos
      if (service.datos && service.datos[property] !== undefined) {
        return service.datos[property];
      }
      
      // Manejar ciertas propiedades con nombres alternativos
      const alternativeNames = {
        'machineId': ['maquinaId', 'customMachineId', 'datos.maquinaId', 'datos.machineId'],
        'customMachineId': ['machineId', 'maquinaId', 'datos.maquinaId', 'datos.customMachineId'],
        'tecnico': ['datos.tecnico', 'datos.technician', 'technician', 'operator'],
        'horasActuales': ['datos.horasActuales', 'currentHours', 'horasMaquina', 'datos.horasMaquina'],
        'horasProximoService': ['datos.horasProximoService', 'nextServiceHours', 'datos.nextServiceHours']
      };
      
      // Si hay alternativas para esta propiedad, intentarlas
      if (alternativeNames[property]) {
        for (const alt of alternativeNames[property]) {
          // Manejar propiedades anidadas (con punto)
          if (alt.includes('.')) {
            const [parent, child] = alt.split('.');
            if (service[parent] && service[parent][child] !== undefined) {
              return service[parent][child];
            }
          } 
          // Propiedad directa
          else if (service[alt] !== undefined) {
            return service[alt];
          }
        }
      }
      
      // No se encontró
      return '';
    };
      // Función para formatear CSV
    const formatCsv = (value) => {
      if (value === null || value === undefined) return '""'; // Devolver string vacío con comillas
      
      // Formatear fechas
      if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      }
      
      // Formatear booleanos
      if (typeof value === 'boolean') {
        return `"${value ? 'SI' : 'NO'}"`;
      }
      
      // Formatear arrays
      if (Array.isArray(value)) {
        return `"${value.join(', ').replace(/"/g, '""')}"`;
      }
      
      // Formatear objetos
      if (typeof value === 'object' && value !== null) {
        try {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } catch (e) {
          return '""';
        }
      }
      
      // String normal
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };
    
    // Crear filas
    const rows = services.map(service => {
      // Formatear fecha
      const fecha = service.createdAt ? 
        new Date(service.createdAt).toLocaleDateString() : 
        service.fecha ? new Date(service.fecha).toLocaleDateString() : '';
      
      // Obtener ID de máquina personalizado
      const machineId = getProperty(service, 'customMachineId') || 
                        getProperty(service, 'machineId') || '';
      
      // Obtener horas
      const horasActuales = getProperty(service, 'horasActuales') || '0';
      const horasProximoService = getProperty(service, 'horasProximoService') || '0';
      
      // Obtener trabajos realizados (pueden ser array o string)
      let trabajos = getProperty(service, 'trabajosRealizados');
      if (Array.isArray(trabajos)) {
        trabajos = trabajos.join(', ');
      }
      
      // Otras propiedades
      const tecnico = getProperty(service, 'tecnico') || '';
      const repuestos = getProperty(service, 'repuestos') || '';
      const observaciones = getProperty(service, 'observaciones') || '';
      const createdBy = service.userId || service.createdBy || 'system';
      
      // Formar fila CSV
      return [
        formatCsv(fecha),
        formatCsv(machineId),
        formatCsv(tecnico),
        formatCsv(horasActuales),
        formatCsv(horasProximoService),
        formatCsv(trabajos),
        formatCsv(repuestos),
        formatCsv(observaciones),
        formatCsv(createdBy)
      ].join(',');
    });
    
    // Combinar encabezados y filas
    return `${headers.join(',')}\n${rows.join('\n')}`;
  } catch (error) {
    console.error('[API] Error generating services CSV:', error);
    return 'Error generating CSV';
  }
}

// Función para generar CSV de prestart según el formato solicitado
function generatePrestartCsv(prestarts) {
  if (!prestarts || prestarts.length === 0) {
    return 'No data available';
  }
  
  try {
    // Definir encabezados según formato solicitado
    const headers = [
      'Created Date',
      'Machine ID',
      'Operator',
      'Machine Hours',
      'Hours Next Service',
      'Check Item 1',  // Aceite
      'Check Item 2',  // Agua
      'Check Item 3',  // Neumáticos
      'Observations',
      'Created By'
    ];
    
    // Función para obtener propiedades de forma segura
    const getProperty = (record, property) => {
      // Buscar directamente en el record
      if (record[property] !== undefined) {
        return record[property];
      }
      
      // Buscar en el objeto datos
      if (record.datos && record.datos[property] !== undefined) {
        return record.datos[property];
      }
      
      // Buscar en el objeto checkValues (estructura nueva)
      if (record.checkValues && record.checkValues[property] !== undefined) {
        return record.checkValues[property];
      }
      
      // No se encontró
      return '';
    };
    
    // Función para formatear valores para CSV
    const formatCsv = (value) => {
      if (value === null || value === undefined) return '""';
      if (typeof value === 'boolean') return `"${value ? 'SI' : 'NO'}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    };
    
    // Crear filas
    const rows = prestarts.map(record => {
      // Formatear fecha
      const fecha = record.createdAt ? 
        new Date(record.createdAt).toLocaleDateString() : 
        record.fecha ? new Date(record.fecha).toLocaleDateString() : '';
      
      // Obtener ID de máquina personalizado
      const machineId = 
        getProperty(record, 'customMachineId') || 
        getProperty(record, 'machineId') || 
        getProperty(record, 'maquinaId') || '';
      
      // Obtener datos del operador
      const operador = getProperty(record, 'operador') || '';
      
      // Obtener horas
      const horasMaquina = getProperty(record, 'horasMaquina') || '0';
      const horasProximoService = getProperty(record, 'horasProximoService') || '0';
      
      // Obtener valores de check
      // CheckItem 1: Aceite
      const checkItem1 = getCheckValue(record, 'aceite');
      
      // CheckItem 2: Agua
      const checkItem2 = getCheckValue(record, 'agua');
      
      // CheckItem 3: Neumáticos
      const checkItem3 = getCheckValue(record, 'neumaticos');
      
      // Observaciones
      const observaciones = getProperty(record, 'observaciones') || '';
      
      // Creado por
      const createdBy = record.createdBy || record.userId || 'system';
      
      // Formar fila CSV
      return [
        formatCsv(fecha),
        formatCsv(machineId),
        formatCsv(operador),
        formatCsv(horasMaquina),
        formatCsv(horasProximoService),
        formatCsv(checkItem1),
        formatCsv(checkItem2),
        formatCsv(checkItem3),
        formatCsv(observaciones),
        formatCsv(createdBy)
      ].join(',');
    });
    
    // Combinar encabezados y filas
    return `${headers.join(',')}\n${rows.join('\n')}`;
  } catch (error) {
    console.error('[API] Error generating prestart CSV:', error);
    return 'Error generating CSV';
  }
}

// Función auxiliar para extraer valores de check de diferentes estructuras de datos
function getCheckValue(record, checkName) {
  // Primero intentar en checkValues (nueva estructura)
  if (record.checkValues && record.checkValues[checkName] !== undefined) {
    return record.checkValues[checkName] ? 'SI' : 'NO';
  }
  
  // Luego intentar directamente en el registro (estructura antigua)
  if (record[checkName] !== undefined) {
    return record[checkName] ? 'SI' : 'NO';
  }
  
  // Finalmente intentar en el objeto datos (otra estructura antigua)
  if (record.datos && record.datos[checkName] !== undefined) {
    return record.datos[checkName] ? 'SI' : 'NO';
  }
  
  // Si no se encuentra, devolver valor predeterminado
  return 'N/A';
}