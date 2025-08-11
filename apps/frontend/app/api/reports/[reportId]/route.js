import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// Function to generate diesel CSV with the same format as DieselHistory
function generateDieselCSV(records, workplace = null) {
  // Define headers with clear column names for easy filtering (same as DieselHistory)
  const headers = [
    'Workplace',
    'Date',
    'Time', 
    'Tank_ID',
    'Tank_Name',
    'Machine_ID',
    'Machine_Name',
    'Fuel_Liters',
    'Operator_Name',
    'Work_Job_Description',
    'Additional_Notes',
    'Week_Day'
  ];
  
  // Process data with proper formatting and additional columns for filtering
  const csvData = records.map(record => {
    const recordDate = new Date(record.fecha);
    const dateStr = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr = recordDate.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS format
    const weekDay = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return [
      record.workplaceName || record.workplace || workplace || 'All Workplaces',
      dateStr,
      timeStr,
      record.tankId || '',
      record.tankName || '',
      record.customMachineId || record.maquinaId || '',
      record.machineName || '',
      parseFloat(record.litros || 0),
      record.operador || '',
      record.trabajo || '',
      (record.observaciones || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' '),
      weekDay
    ];
  });
  
  // Create CSV content with proper column separation using comma for standard CSV format
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  csvData.forEach(row => {
    const processedRow = row.map(field => {
      // Convert to string and handle special characters
      let stringField = String(field || '').trim();
      
      // If field contains comma, quote, or newline, wrap in quotes
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        stringField = '"' + stringField.replace(/"/g, '""') + '"';
      }
      
      return stringField;
    });
    
    csvRows.push(processedRow.join(','));
  });
  
  const csvContent = csvRows.join('\r\n');
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

// Function to generate prestart CSV with organized columns
function generatePrestartCSV(records, machines = [], templates = [], workplace = null) {
  // First, determine all possible check items across all records
  const allCheckItems = new Set();
  records.forEach(record => {
    if (record.checkValues && typeof record.checkValues === 'object') {
      // New format with checkValues object
      Object.keys(record.checkValues).forEach(key => allCheckItems.add(key));
    } else {
      // Legacy format with individual item fields (item1, item2, etc.)
      Object.keys(record).filter(key => key.startsWith('item') && /^item\d+$/.test(key))
        .forEach(key => allCheckItems.add(key));
    }
  });
  
  // Sort check items numerically (item1, item2, item3, etc.)
  const sortedCheckItems = Array.from(allCheckItems).sort((a, b) => {
    const numA = parseInt(a.replace('item', '')) || 0;
    const numB = parseInt(b.replace('item', '')) || 0;
    return numA - numB;
  });
  
  // Define headers with check items columns
  const baseHeaders = [
    'Workplace',
    'Date',
    'Time',
    'Machine_ID',
    'Machine_Name',
    'Machine_Brand',
    'Machine_Model',
    'Template_ID',
    'Operator_Name',
    'Machine_Hours',
    'Next_Service_Hours'
  ];
  
  // Add check items columns (e.g., Item1, Item2, Item3, etc.)
  const checkItemHeaders = sortedCheckItems.map(item => item.replace('item', 'Item'));
  
  const endHeaders = [
    'Observations',
    'Week_Day',
    'Source'
  ];
  
  const headers = [...baseHeaders, ...checkItemHeaders, ...endHeaders];
  
  // Create machine and template lookup maps for faster access
  const machineMap = new Map(machines.map(m => [m._id?.toString() || m._id, m]));
  const templateMap = new Map(templates.map(t => [t._id?.toString() || t._id, t]));
  
  // Process data with proper formatting
  const csvData = records.map(record => {
    // Handle date - prestart records might use 'fecha' or 'createdAt'
    const recordDate = new Date(record.fecha || record.createdAt);
    const dateStr = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr = recordDate.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS format
    const weekDay = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get machine info
    const machine = machineMap.get(record.maquinaId?.toString() || record.maquinaId) || {};
    const machineId = machine.machineId || record.maquinaId || '';
    const machineName = machine.name || machine.model || '';
    const machineBrand = machine.brand || '';
    const machineModel = machine.model || '';
    
    // Get template info - only use template name as ID (not the MongoDB _id)
    const template = templateMap.get(record.templateId?.toString() || record.templateId) || {};
    const templateId = template.name || record.templateId || '';
    
    // Get check items values
    const checkItemValues = sortedCheckItems.map(itemKey => {
      if (record.checkValues && typeof record.checkValues === 'object') {
        // New format with checkValues object
        return record.checkValues[itemKey] ? 'OK' : 'FAIL';
      } else {
        // Legacy format with individual item fields
        return record[itemKey] === true ? 'OK' : (record[itemKey] === false ? 'FAIL' : 'N/A');
      }
    });
    
    // Build the row data
    const baseData = [
      record.workplaceName || record.workplace || workplace || 'All Workplaces',
      dateStr,
      timeStr,
      machineId,
      machineName,
      machineBrand,
      machineModel,
      templateId,
      record.operador || '',
      record.horasMaquina || '',
      record.horasProximoService || ''
    ];
    
    const endData = [
      (record.observaciones || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' '),
      weekDay,
      record.source || 'manual'
    ];
    
    return [...baseData, ...checkItemValues, ...endData];
  });
  
  // Create CSV content with proper column separation using comma for standard CSV format
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  csvData.forEach(row => {
    const processedRow = row.map(field => {
      // Convert to string and handle special characters
      let stringField = String(field || '').trim();
      
      // If field contains comma, quote, or newline, wrap in quotes
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        stringField = '"' + stringField.replace(/"/g, '""') + '"';
      }
      
      return stringField;
    });
    
    csvRows.push(processedRow.join(','));
  });
  
  const csvContent = csvRows.join('\r\n');
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

// Function to generate services CSV with organized columns
function generateServicesCSV(records, machines = [], workplace = null) {
  // Define headers with clear column names for easy filtering
  const headers = [
    'Workplace',
    'Date',
    'Time',
    'Machine_ID',
    'Machine_Name',
    'Machine_Brand',
    'Machine_Model',
    'Service_Type',
    'Technician',
    'Current_Hours',
    'Next_Service_Hours',
    'Works_Performed',
    'Parts_Used',
    'Cost',
    'Status',
    'Observations',
    'Week_Day',
    'Source'
  ];
  
  // Create machine lookup map for faster access
  const machineMap = new Map(machines.map(m => [m._id?.toString() || m._id, m]));
  
  // Process data with proper formatting
  const csvData = records.map(record => {
    // Handle date - services records use 'fecha' or 'createdAt'
    const recordDate = new Date(record.fecha || record.createdAt);
    const dateStr = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr = recordDate.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS format
    const weekDay = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get machine info
    const machineId = record.machineId || record.maquinaId || record.datos?.machineId || '';
    const machine = machineMap.get(machineId?.toString() || machineId) || {};
    const machineCustomId = machine.customId || record.customMachineId || machineId;
    const machineName = machine.name || machine.model || record.datos?.maquina || '';
    const machineBrand = machine.brand || '';
    const machineModel = machine.model || '';
    
    // Get service data from datos object
    const datos = record.datos || {};
    const serviceType = datos.tipoService || record.tipo || '';
    const technician = datos.tecnico || '';
    const currentHours = datos.horasActuales || '';
    const nextServiceHours = datos.horasProximoService || '';
    
    // Format works performed (array to string)
    const worksPerformed = Array.isArray(datos.trabajosRealizados) 
      ? datos.trabajosRealizados.join(', ') 
      : (datos.trabajosRealizados || '');
    
    const partsUsed = datos.repuestos || '';
    const cost = datos.costo || '';
    const status = record.status || '';
    const observations = (datos.observaciones || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ');
    
    return [
      record.workplaceName || record.workplace || workplace || 'All Workplaces',
      dateStr,
      timeStr,
      machineCustomId,
      machineName,
      machineBrand,
      machineModel,
      serviceType,
      technician,
      currentHours,
      nextServiceHours,
      worksPerformed,
      partsUsed,
      cost,
      status,
      observations,
      weekDay,
      record.source || 'manual'
    ];
  });
  
  // Create CSV content with proper column separation using comma for standard CSV format
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  csvData.forEach(row => {
    const processedRow = row.map(field => {
      // Convert to string and handle special characters
      let stringField = String(field || '').trim();
      
      // If field contains comma, quote, or newline, wrap in quotes
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        stringField = '"' + stringField.replace(/"/g, '""') + '"';
      }
      
      return stringField;
    });
    
    csvRows.push(processedRow.join(','));
  });
  
  const csvContent = csvRows.join('\r\n');
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

// Function to generate comprehensive machines CSV with ALL available data
function generateMachinesCSV(records, workplace = null) {
  // Define comprehensive headers with ALL machine information
  const headers = [
    // Basic Info
    'Workplace',
    'Date',
    'Time',
    'Machine_ID',
    'Machine_Name',
    'Machine_Brand',
    'Machine_Model',
    'Machine_Year',
    'Serial_Number',
    
    // Hours & Service
    'Current_Hours',
    'Last_Service',
    'Next_Service',
    
    // Engine Oil Details
    'Engine_Oil_Type',
    'Engine_Oil_Capacity',
    'Engine_Oil_Brand',
    
    // Hydraulic Oil Details
    'Hydraulic_Oil_Type',
    'Hydraulic_Oil_Capacity',
    'Hydraulic_Oil_Brand',
    
    // Transmission Oil Details
    'Transmission_Oil_Type',
    'Transmission_Oil_Capacity',
    'Transmission_Oil_Brand',
    
    // Filter Details
    'Filter_Engine',
    'Filter_Engine_Brand',
    'Filter_Transmission',
    'Filter_Transmission_Brand',
    'Filter_Fuel',
    'Filter_Fuel_Brand',
    
    // Tire Details - Front
    'Tire_Front_Size',
    'Tire_Front_Pressure',
    'Tire_Front_Brand',
    
    // Tire Details - Rear
    'Tire_Rear_Size',
    'Tire_Rear_Pressure',
    'Tire_Rear_Brand',
    
    // Additional Info
    'Prestart_Template_ID',
    'Created_By',
    'Week_Day',
    'Source'
  ];
  
  // Process data with ALL available information
  const csvData = records.map(record => {
    // Handle date
    const recordDate = new Date(record.createdAt || record.updatedAt || new Date());
    const dateStr = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr = recordDate.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS format
    const weekDay = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Extract nested object data safely
    const engineOil = record.engineOil || {};
    const hydraulicOil = record.hydraulicOil || {};
    const transmissionOil = record.transmissionOil || {};
    const filters = record.filters || {};
    const tires = record.tires || {};
    const tireFront = tires.front || {};
    const tireRear = tires.rear || {};
    
    // Build comprehensive row data
    return [
      // Basic Info
      record.workplaceName || record.workplace || workplace || 'All Workplaces',
      dateStr,
      timeStr,
      record.customId || record.machineId || record._id?.toString() || '',
      record.name || record.model || '',
      record.brand || '',
      record.model || '',
      record.year || '',
      record.serialNumber || '',
      
      // Hours & Service
      record.currentHours || '',
      record.lastService || '',
      record.nextService || '',
      
      // Engine Oil Details
      engineOil.type || '',
      engineOil.capacity || '',
      engineOil.brand || '',
      
      // Hydraulic Oil Details
      hydraulicOil.type || '',
      hydraulicOil.capacity || '',
      hydraulicOil.brand || '',
      
      // Transmission Oil Details
      transmissionOil.type || '',
      transmissionOil.capacity || '',
      transmissionOil.brand || '',
      
      // Filter Details
      filters.engine || '',
      filters.engineBrand || '',
      filters.transmission || '',
      filters.transmissionBrand || '',
      filters.fuel || '',
      filters.fuelBrand || '',
      
      // Tire Details - Front
      tireFront.size || '',
      tireFront.pressure || '',
      tireFront.brand || '',
      
      // Tire Details - Rear
      tireRear.size || '',
      tireRear.pressure || '',
      tireRear.brand || '',
      
      // Additional Info
      record.prestartTemplateId || '',
      record.createdBy || '',
      weekDay,
      'database'
    ];
  });
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  csvData.forEach(row => {
    const processedRow = row.map(field => {
      // Convert to string and handle special characters
      let stringField = String(field || '').trim();
      
      // If field contains comma, quote, or newline, wrap in quotes
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        stringField = '"' + stringField.replace(/"/g, '""') + '"';
      }
      
      return stringField;
    });
    
    csvRows.push(processedRow.join(','));
  });
  
  const csvContent = csvRows.join('\r\n');
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

export async function GET(request, context) {
  try {
    // Get reportId from URL
    const resolvedParams = await context.params; // Resolver la promesa de params
    const reportId = resolvedParams.reportId; // Acceder a reportId después de resolver params
    console.log('[API] Fetching report ID:', reportId);
    console.log('[API] Context params:', context.params);

    if (!ObjectId.isValid(reportId)) {
      return NextResponse.json({ error: "Invalid report ID format" }, { status: 400 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    const format = searchParams.get('format') || 'json';

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    const db = await connectDB();
    
    // Find the report metadata
    const reportMeta = await db.collection('reports').findOne({
      _id: new ObjectId(reportId),
      userId: session.user.id  // Ensure user can only access their own reports
    });

    if (!reportMeta) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    console.log('[API] Found report metadata:', reportMeta);

    // Determine which collection to query based on report type
    let collection;
    let reportTypeName = 'Report';
    
    switch(reportMeta.type) {
      case 'prestart':
        collection = 'prestart';
        reportTypeName = 'Prestarts Report';
        break;
      case 'service':
      case 'services': // Handle both variants
        collection = 'services';
        reportTypeName = 'Services Report';
        break;
      case 'machine':
        collection = 'machines';
        reportTypeName = 'Machinery Report';
        break;
      case 'diesel':
        collection = 'diesel_records';
        reportTypeName = 'Fuel Consumption Report';
        break;
      default:
        collection = reportMeta.type;
        reportTypeName = `${reportMeta.type.charAt(0).toUpperCase() + reportMeta.type.slice(1)} Report`;
    }

    // Build query based on report parameters
    let query = {};
    
    // Use the saved query from report metadata if available, otherwise build new one
    if (reportMeta.query) {
      try {
        query = JSON.parse(reportMeta.query);
        console.log('[API] Using saved query from report metadata:', query);
        
        // Clean up problematic fields that can cause query conflicts
        // Remove maquinaId from non-diesel reports to avoid conflicts with machineId
        if (reportMeta.type !== 'diesel' && query.maquinaId) {
          console.log('[API] Removing problematic maquinaId field from non-diesel query');
          delete query.maquinaId;
        }
        
        // Convert date strings to Date objects in the saved query
        if (query.createdAt) {
          if (query.createdAt.$gte && typeof query.createdAt.$gte === 'string') {
            query.createdAt.$gte = new Date(query.createdAt.$gte);
            console.log('[API] Converted createdAt.$gte to Date object:', query.createdAt.$gte);
          }
          if (query.createdAt.$lte && typeof query.createdAt.$lte === 'string') {
            query.createdAt.$lte = new Date(query.createdAt.$lte);
            console.log('[API] Converted createdAt.$lte to Date object:', query.createdAt.$lte);
          }
        }
        if (query.fecha) {
          if (query.fecha.$gte && typeof query.fecha.$gte === 'string') {
            query.fecha.$gte = new Date(query.fecha.$gte);
            console.log('[API] Converted fecha.$gte to Date object:', query.fecha.$gte);
          }
          if (query.fecha.$lte && typeof query.fecha.$lte === 'string') {
            query.fecha.$lte = new Date(query.fecha.$lte);
            console.log('[API] Converted fecha.$lte to Date object:', query.fecha.$lte);
          }
        }
        
        // Convert string IDs to ObjectId for diesel records
        if (reportMeta.type === 'diesel') {
          if (query.userId) {
            if (typeof query.userId === 'string') {
              query.userId = ObjectId.isValid(query.userId) ? new ObjectId(query.userId) : query.userId;
            } else if (query.userId.$in && Array.isArray(query.userId.$in)) {
              query.userId.$in = query.userId.$in.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
            }
          }
          if (query.maquinaId) {
            if (typeof query.maquinaId === 'string') {
              query.maquinaId = ObjectId.isValid(query.maquinaId) ? new ObjectId(query.maquinaId) : query.maquinaId;
            }
          }
        }
      } catch (error) {
        console.log('[API] Error parsing saved query, building new one:', error);
        // Fallback to building query
        if (reportMeta.type === 'diesel') {
          // Use same filter logic as /api/diesel endpoint
          if (session.user.role === 'SUPER_ADMIN') {
            // Super admin can see all records
          } else if (session.user.credentialId) {
            query.credentialId = session.user.credentialId;
          } else if (session.user.organization || session.user.company) {
            query.organization = session.user.organization || session.user.company;
          } else {
            query.userId = ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id;
          }
        } else {
          query.userId = session.user.id;
        }
      }
    } else {
      // Add user filter based on report type - using same logic as original endpoints
      if (reportMeta.type === 'diesel') {
        // Use same filter logic as /api/diesel endpoint
        if (session.user.role === 'SUPER_ADMIN') {
          // Super admin can see all records
        } else if (session.user.credentialId) {
          query.credentialId = session.user.credentialId;
        } else if (session.user.organization || session.user.company) {
          query.organization = session.user.organization || session.user.company;
        } else {
          query.userId = ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id;
        }
      } else {
        query.userId = session.user.id;
      }
    }
    
    // Añadir filtro de máquina si existe
    if (reportMeta.machineId) {
      if (reportMeta.type === 'diesel') {
        // For diesel reports, use the same machine filtering as /api/diesel and convert to ObjectId
        query.maquinaId = ObjectId.isValid(reportMeta.machineId) ? new ObjectId(reportMeta.machineId) : reportMeta.machineId;
      } else {
        // For workplace reports, combine userId with machine filter
        if (query.userId) {
          // If we have a userId from saved query (workplace case), combine with machine filter
          query.$and = [
            { userId: query.userId },
            {
              $or: [
                { machineId: reportMeta.machineId },
                { maquinaId: reportMeta.machineId },
                { customMachineId: reportMeta.machineId },
                { 'datos.machineId': reportMeta.machineId },
                { 'datos.maquinaId': reportMeta.machineId },
                // Add ObjectId versions for both field names
                { machineId: ObjectId.isValid(reportMeta.machineId) ? new ObjectId(reportMeta.machineId) : reportMeta.machineId },
                { maquinaId: ObjectId.isValid(reportMeta.machineId) ? new ObjectId(reportMeta.machineId) : reportMeta.machineId }
              ]
            }
          ];
          // Remove the userId from the root to avoid duplication
          delete query.userId;
        } else {
          // Utilizar $or para buscar en varios campos posibles de ID de máquina para otros tipos
          query.$or = [
            { machineId: reportMeta.machineId },
            { maquinaId: reportMeta.machineId },
            { customMachineId: reportMeta.machineId },
            { 'datos.machineId': reportMeta.machineId },
            { 'datos.maquinaId': reportMeta.machineId },
            // Add ObjectId versions for both field names
            { machineId: ObjectId.isValid(reportMeta.machineId) ? new ObjectId(reportMeta.machineId) : reportMeta.machineId },
            { maquinaId: ObjectId.isValid(reportMeta.machineId) ? new ObjectId(reportMeta.machineId) : reportMeta.machineId }
          ];
        }
      }
    }
    
    // Aplicar filtros de fecha utilizando la función mejorada
    if (reportMeta.dateFrom || reportMeta.dateTo) {
      console.log(`[API] Aplicando filtros de fecha: desde=${reportMeta.dateFrom || 'N/A'}, hasta=${reportMeta.dateTo || 'N/A'}`);
      console.log(`[API] Tipos de fecha: dateFrom=${typeof reportMeta.dateFrom}, dateTo=${typeof reportMeta.dateTo}`);
      
      if (reportMeta.type === 'diesel') {
        // For diesel reports, use the same date filtering as /api/diesel
        query.fecha = {};
        if (reportMeta.dateFrom) {
          const fromDate = new Date(reportMeta.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          query.fecha.$gte = fromDate;
          console.log(`[API] Diesel from date: ${fromDate.toISOString()}`);
        }
        if (reportMeta.dateTo) {
          const toDate = new Date(reportMeta.dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.fecha.$lte = toDate;
          console.log(`[API] Diesel to date: ${toDate.toISOString()}`);
        }
      } else {
        // Apply date filter based on collection type - same as generate endpoint
        const dateQuery = {};
        if (reportMeta.dateFrom) {
          const fromDateObj = new Date(reportMeta.dateFrom);
          fromDateObj.setHours(0, 0, 0, 0);
          dateQuery.$gte = fromDateObj;
          console.log(`[API] From date object: ${fromDateObj.toISOString()}`);
        }
        
        if (reportMeta.dateTo) {
          const toDateObj = new Date(reportMeta.dateTo);
          toDateObj.setHours(23, 59, 59, 999);
          dateQuery.$lte = toDateObj;
          console.log(`[API] To date object: ${toDateObj.toISOString()}`);
        }
        
        // Apply date filter based on collection type - same logic as generate endpoint
        switch(reportMeta.type) {
          case 'prestart':
            const prestartOrConditions = [
              { fecha: dateQuery },
              { createdAt: dateQuery },
              { 
                fecha: { 
                  $gte: dateQuery.$gte?.toISOString().split('T')[0], 
                  $lte: dateQuery.$lte?.toISOString().split('T')[0] 
                } 
              }
            ].filter(condition => {
              const fieldValue = Object.values(condition)[0];
              return fieldValue && (fieldValue.$gte !== undefined || fieldValue.$lte !== undefined);
            });
            
            if (prestartOrConditions.length > 0) {
              query = { $and: [query, { $or: prestartOrConditions }] };
            }
            break;
            
          case 'service':
          case 'services':
            const serviceOrConditions = [
              { fecha: dateQuery },
              { createdAt: dateQuery }
            ];
            query = { $and: [query, { $or: serviceOrConditions }] };
            break;
            
          case 'machine':
            query.createdAt = dateQuery;
            break;
        }
      }
      
      console.log(`[API] Consulta con filtros de fecha:`, JSON.stringify(query, null, 2));
    }

    console.log('[API] Final download query:', JSON.stringify(query, null, 2));

    // Special handling for organizational reports - remove automatic date filters
    // if no explicit dates were provided by user
    if (reportMeta.params?.workplace === 'all') {
      console.log('[API] Organizational report detected - checking date filters');
      
      // Check if the dates in params are null (meaning no explicit dates were provided)
      const hasExplicitDates = reportMeta.params?.startDate && reportMeta.params?.endDate;
      
      if (!hasExplicitDates) {
        console.log('[API] No explicit dates provided - removing automatic date filters');
        
        // Remove date filters based on report type
        if (reportMeta.type === 'machine') {
          // Remove createdAt date filters from the query for machines
          if (query.createdAt) {
            delete query.createdAt;
            console.log('[API] Removed createdAt filter from machine query');
          }
        } else if (reportMeta.type === 'prestart' || reportMeta.type === 'service' || reportMeta.type === 'services') {
          // Remove createdAt date filters for prestart and services
          if (query.createdAt) {
            delete query.createdAt;
            console.log(`[API] Removed createdAt filter from ${reportMeta.type} query`);
          }
        } else if (reportMeta.type === 'diesel') {
          // Remove fecha date filters for diesel
          if (query.fecha) {
            delete query.fecha;
            console.log('[API] Removed fecha filter from diesel query');
          }
        }
        
        // If the query is wrapped in $and, clean it up
        if (query.$and && Array.isArray(query.$and)) {
          query.$and = query.$and.filter(condition => 
            !condition.createdAt && !condition.fecha
          );
          if (query.$and.length === 1) {
            // If only one condition left, unwrap it
            const remainingCondition = query.$and[0];
            delete query.$and;
            Object.assign(query, remainingCondition);
          } else if (query.$and.length === 0) {
            delete query.$and;
          }
        }
        
        console.log('[API] Final query after date filter removal:', JSON.stringify(query, null, 2));
      } else {
        console.log('[API] Explicit dates provided - keeping date filters');
      }
    }

    // Fetch the actual report data from the specified collection
    let reportData;
    if (reportMeta.type === 'diesel') {
      // Use same sorting as /api/diesel endpoint
      reportData = await db.collection(collection)
        .find(query)
        .sort({ fecha: -1, createdAt: -1 })
        .toArray();
    } else {
      reportData = await db.collection(collection).find(query).toArray();
    }
    console.log('Query Result:', reportData);

    // For organizational reports, enrich data with user workplace information
    if (reportMeta.params?.workplace === 'all' && reportData.length > 0) {
      console.log('[API] Enriching organizational report data with workplace information');
      
      // Get unique user IDs from the data
      const userIds = [...new Set(reportData.map(record => 
        record.userId || record.createdBy
      ).filter(Boolean))];
      
      if (userIds.length > 0) {
        // Fetch user information
        const users = await db.collection('users').find({
          _id: { $in: userIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id) }
        }).toArray();
        
        // Create user lookup map
        const userMap = new Map();
        users.forEach(user => {
          userMap.set(user._id.toString(), {
            userName: user.name || user.email,
            workplaceName: user.workplaceName || 'N/A'
          });
        });
        
        // Enrich report data with workplace information
        reportData = reportData.map(record => {
          const userId = (record.userId || record.createdBy)?.toString();
          const userInfo = userMap.get(userId);
          
          return {
            ...record,
            userName: userInfo?.userName || record.userName || 'Unknown',
            workplaceName: userInfo?.workplaceName || record.workplaceName || 'N/A'
          };
        });
        
        console.log(`[API] Enriched ${reportData.length} records with workplace information`);
      }
    }

    // For prestart and services reports, fetch additional machine data
    let machines = [];
    let templates = [];
    if ((reportMeta.type === 'prestart' || reportMeta.type === 'service' || reportMeta.type === 'services') && reportData.length > 0) {
      // Get unique machine IDs from the data
      const machineIds = [...new Set(reportData.map(item => 
        item.maquinaId || item.machineId || item.datos?.machineId
      ).filter(Boolean))];
      
      // Fetch machine data
      if (machineIds.length > 0) {
        const machineObjectIds = machineIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id).filter(Boolean);
        if (machineObjectIds.length > 0) {
          machines = await db.collection('machines').find({
            _id: { $in: machineObjectIds }
          }).toArray();
        }
      }
      
      // For prestart reports, also fetch template data
      if (reportMeta.type === 'prestart') {
        const templateIds = [...new Set(reportData.map(item => item.templateId).filter(Boolean))];
        if (templateIds.length > 0) {
          const templateObjectIds = templateIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id).filter(Boolean);
          if (templateObjectIds.length > 0) {
            templates = await db.collection('prestartTemplates').find({
              _id: { $in: templateObjectIds }
            }).toArray();
          }
        }
        console.log(`[API] Fetched ${machines.length} machines and ${templates.length} templates for prestart report`);
      } else if (reportMeta.type === 'service' || reportMeta.type === 'services') {
        console.log(`[API] Fetched ${machines.length} machines for services report`);
      }
    }

    // Process data for response
    const processedData = reportData.map(item => {
      const processed = { ...item };
      if (processed._id) {
        processed._id = processed._id.toString();
      }
      return processed;
    });

    // Función para aplanar objetos anidados
    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
      return flattened;
    };

    // Aplanar los datos procesados
    const flattenedData = processedData.map(item => flattenObject(item));
    console.log('Flattened Data in API:', flattenedData);

    // Prepare filename and creation date with descriptive names
    const timestamp = new Date().toISOString().split('T')[0];
    const creationDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    // Generate descriptive filename based on report type
    let descriptiveName = '';
    switch(reportMeta.type) {
      case 'prestart':
        descriptiveName = 'Reporte-Prestarts';
        break;
      case 'service':
      case 'services':
        descriptiveName = 'Reporte-Servicios';
        break;
      case 'machine':
        descriptiveName = 'Reporte-Maquinaria';
        break;
      case 'diesel':
        descriptiveName = 'Reporte-Combustible';
        break;
      default:
        descriptiveName = `Reporte-${reportMeta.type.charAt(0).toUpperCase() + reportMeta.type.slice(1)}`;
    }
    
    const filename = `${descriptiveName}-${timestamp}.${format === 'csv' ? 'csv' : 'json'}`;

    // Generate CSV content based on report type
    let csvContent = null;
    if (format === 'csv') {
      if (reportMeta.type === 'diesel') {
        csvContent = generateDieselCSV(processedData, reportMeta.workplace);
      } else if (reportMeta.type === 'prestart') {
        csvContent = generatePrestartCSV(processedData, machines, templates, reportMeta.workplace);
      } else if (reportMeta.type === 'service' || reportMeta.type === 'services') {
        csvContent = generateServicesCSV(processedData, machines, reportMeta.workplace);
      } else if (reportMeta.type === 'machine') {
        // Use original processedData (not flattened) for machines to preserve object structure
        csvContent = generateMachinesCSV(processedData, reportMeta.workplace);
      }
    }

    // If CSV format is requested, return the file directly
    if (format === 'csv' && csvContent) {
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`,
          'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Return the data with additional metadata for proper CSV formatting
    return NextResponse.json({
      success: true,
      data: flattenedData,
      csvContent: csvContent, // Include pre-generated CSV content when requested
      filename: filename,
      reportMeta: {
        type: reportMeta.type,
        typeName: reportTypeName,
        createdAt: reportMeta.createdAt,
        creationDate: creationDate,
        recordCount: processedData.length
      }
    });
    
  } catch (error) {
    console.error('[API] Error retrieving report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}