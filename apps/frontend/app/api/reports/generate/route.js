import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// Función para aplanar objetos anidados
function flattenObject(ob) {
  let result = {};

  for (const i in ob) {
    if (ob[i] && typeof ob[i] === 'object' && !Array.isArray(ob[i])) {
      const temp = flattenObject(ob[i]);
      for (const j in temp) {
        result[`${i}.${j}`] = temp[j];
      }
    } else {
      result[i] = ob[i] !== undefined && ob[i] !== null ? ob[i] : '';
    }
  }

  return result;
}

export async function POST(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    const { type, fromDate, toDate, machineId, format, workplace, category, dateRange, isOrganizational } = data;
    
    console.log(`[DEBUG] Request data:`, {
      type,
      fromDate,
      toDate,
      machineId,
      format,
      workplace,
      category,
      dateRange,
      isOrganizational
    });

    // Handle organizational reports for admins
    if ((session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
      // Check if it's a specific organizational type (org-prestart, org-service, etc.)
      if (type && type.startsWith('org-')) {
        const baseType = type.replace('org-', '');
        console.log(`[ADMIN] Handling org- type report: ${type} -> ${baseType}`);
        return await handleSpecificOrganizationalReport(session, { 
          type: baseType === 'service' ? 'services' : baseType, 
          fromDate, 
          toDate, 
          workplace: 'all', 
          dateRange 
        });
      }
      // Check if it's marked as organizational or workplace is "all"
      else if (isOrganizational || workplace === 'all' || workplace === '' || type === 'organizational') {
        console.log(`[ADMIN] Handling generic organizational report`);
        return await handleOrganizationalReport(session, { 
          category: type !== 'organizational' ? type : category, 
          fromDate, 
          toDate, 
          workplace, 
          dateRange 
        });
      }
    }
    
    // Renombrar los parámetros para que coincidan con el filtro existente
    const dateFrom = fromDate;
    const dateTo = toDate;
    
    // Validate required field
    if (!type) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 });
    }
    
    // Determine which collection to query based on report type
    let collection;
    switch(type) {
      case 'prestart':
        collection = 'prestart';
        break;
      case 'service':
      case 'services': // Manejar ambas versiones del tipo
        collection = 'services';
        break;
      case 'machine':
        collection = 'machines';
        break;
      case 'diesel':
        collection = 'diesel_records';
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
    
    console.log(`Report type: ${type}, Collection: ${collection}`);
    
    // Connect to database
    const db = await connectDB();
    
    // Prepare query based on type
    let query = {};
    
    // Determine who's data to get based on role and workplace selection
    let targetUserIds = [];
    
    if (workplace && (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
      // Admin selecting a workplace - get data from workplace users, not admin
      console.log(`Admin requesting workplace data for: ${workplace}`);
      
      let userFilter = { workplaceName: workplace };
      
      // If ADMIN (not SUPER_ADMIN), filter by organization
      if (session.user.role === 'ADMIN') {
        userFilter.organizationId = session.user.organizationId;
      }
      
      const usersInWorkplace = await db.collection('users').find(userFilter).toArray();
      targetUserIds = usersInWorkplace.map(user => user._id.toString());
      
      console.log(`Found ${targetUserIds.length} users in workplace ${workplace}:`, targetUserIds);
      
      if (targetUserIds.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: `No users found in workplace: ${workplace}`,
          data: [] 
        });
      }
    } else {
      // Regular user or admin without workplace - use their own data
      targetUserIds = [session.user.id];
    }
    
    // Add userId filter based on target users
    switch(type) {
      case 'diesel':
        // Diesel records use credentialId for organization filtering
        if (targetUserIds.length === 1 && session.user.credentialId && !workplace) {
          query.credentialId = session.user.credentialId;
        } else {
          // Convert userId to ObjectId for diesel records since they're stored as ObjectId
          const userObjectIds = targetUserIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
          query.userId = userObjectIds.length === 1 ? userObjectIds[0] : { $in: userObjectIds };
        }
        break;
      default:
        query.userId = targetUserIds.length === 1 ? targetUserIds[0] : { $in: targetUserIds };
        break;
    }
    
    console.log(`Target user IDs: ${targetUserIds.join(', ')}`);
    console.log(`Base query: ${JSON.stringify(query)}`);
    
    // DEBUGGING: Let's see what data exists in the collection first
    const sampleData = await db.collection(collection).find({}).limit(3).toArray();
    console.log(`Sample data from ${collection}:`, JSON.stringify(sampleData, null, 2));
    
      // Add date filters if provided - simplified approach
    if (dateFrom || dateTo) {
      console.log(`Date filtering requested: from=${dateFrom}, to=${dateTo}`);
      
      const dateQuery = {};
      if (dateFrom) {
        const fromDateObj = new Date(dateFrom);
        fromDateObj.setHours(0, 0, 0, 0); // Start of day
        dateQuery.$gte = fromDateObj;
        console.log(`From date object: ${fromDateObj.toISOString()}`);
      }
      
      if (dateTo) {
        const toDateObj = new Date(dateTo);
        toDateObj.setHours(23, 59, 59, 999); // End of day
        dateQuery.$lte = toDateObj;
        console.log(`To date object: ${toDateObj.toISOString()}`);
      }
      
      // Apply date filter based on collection type
      switch(type) {
        case 'prestart':
          // For prestart, try multiple date field formats
          const prestartOrConditions = [
            { fecha: dateQuery }, // Date format
            { createdAt: dateQuery }, // Alternative date field
            // String date format (ISO strings)
            { 
              fecha: { 
                $gte: dateQuery.$gte?.toISOString().split('T')[0], 
                $lte: dateQuery.$lte?.toISOString().split('T')[0] 
              } 
            }
          ].filter(condition => {
            // Only include conditions where we have the necessary date parts
            const fieldValue = Object.values(condition)[0];
            return fieldValue && (fieldValue.$gte !== undefined || fieldValue.$lte !== undefined);
          });
          
          if (prestartOrConditions.length > 0) {
            query = { $and: [query, { $or: prestartOrConditions }] };
          }
          break;
          
        case 'service':
        case 'services':
          // For services, check both fecha and createdAt
          const serviceOrConditions = [
            { fecha: dateQuery },
            { createdAt: dateQuery }
          ];
          query = { $and: [query, { $or: serviceOrConditions }] };
          break;
          
        case 'machine':
          query.createdAt = dateQuery;
          break;
          
        case 'diesel':
          // For diesel, use fecha field
          query.fecha = dateQuery;
          break;
      }
    }
    
    // Add machine filter if provided
    if (machineId) {
      // If both workplace and machineId are specified, validate that the machine belongs to that workplace
      if (workplace && (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
        console.log(`Validating machine ${machineId} belongs to workplace ${workplace}`);
        
        // Get the machine to check its creator - convert string to ObjectId
        const machine = await db.collection('machines').findOne({ _id: new ObjectId(machineId) });
        
        if (!machine) {
          return NextResponse.json({ 
            success: false,
            error: `Machine not found: ${machineId}`,
            data: [] 
          });
        }
        
        // Get users from the specified workplace within the admin's organization
        let userFilter = { workplaceName: workplace };
        if (session.user.role === 'ADMIN') {
          userFilter.organizationId = session.user.organizationId;
        }
        
        const usersInWorkplace = await db.collection('users').find(userFilter).toArray();
        const userIds = usersInWorkplace.map(user => user._id.toString());
        
        console.log(`Found ${userIds.length} users in workplace ${workplace}:`, userIds);
        
        // Check if the machine belongs to the workplace using the same logic as by-workplace API
        // Machines can belong to workplace through userId, createdBy, or workplaceName field
        const isValidMachine = userIds.includes(machine.userId) || 
                              userIds.includes(machine.createdBy) ||
                              machine.workplaceName === workplace ||
                              (machine.creatorId && userIds.includes(machine.creatorId));
        
        console.log(`Machine validation for ${machineId}:`, {
          machineUserId: machine.userId,
          machineCreatedBy: machine.createdBy,
          machineWorkplaceName: machine.workplaceName,
          machineCreatorId: machine.creatorId,
          workplaceUserIds: userIds,
          isValid: isValidMachine
        });
        
        if (!isValidMachine) {
          return NextResponse.json({ 
            success: false,
            error: `Machine ${machineId} does not belong to workplace ${workplace}`,
            data: [] 
          });
        }
        
        console.log(`Machine ${machineId} validated for workplace ${workplace}`);
      }
      
      // Different collections use different field names for machine ID
      switch(type) {
        case 'diesel':
          // Convert machineId to ObjectId for diesel records since they're stored as ObjectId
          query.maquinaId = ObjectId.isValid(machineId) ? new ObjectId(machineId) : machineId;
          break;
        case 'service':
        case 'services':
          // For services, use the same $or approach as the /api/services endpoint
          query.$or = [
            { machineId: machineId },
            { maquinaId: machineId },
            { 'datos.machineId': machineId }
          ];
          break;
        case 'prestart':
          // For prestart, use common field names
          query.$or = [
            { machineId: machineId },
            { maquinaId: machineId },
            { 'datos.maquinaId': machineId }
          ];
          break;
        default:
          // For other types, use a comprehensive approach
          query.$or = [
            { machineId: machineId },
            { maquinaId: machineId }
          ];
          break;
      }
    }

    console.log(`Generating ${type} report with query:`, JSON.stringify(query, null, 2));
    console.log(`Querying collection: ${collection}`);
    console.log(`Session user ID: ${session.user.id}`);
    
    // DEBUGGING: Test the query without date filters first
    if (dateFrom || dateTo) {
      const queryWithoutDate = { ...query };
      // Remove the $and part that contains date filters
      if (queryWithoutDate.$and) {
        queryWithoutDate.$and = queryWithoutDate.$and.filter(condition => 
          !condition.$or || !condition.$or.some(orCond => orCond.fecha || orCond.createdAt)
        );
        if (queryWithoutDate.$and.length === 1) {
          Object.assign(queryWithoutDate, queryWithoutDate.$and[0]);
          delete queryWithoutDate.$and;
        }
      }
      
      const countWithoutDate = await db.collection(collection).countDocuments(queryWithoutDate);
      console.log(`Documents without date filter: ${countWithoutDate}`);
      console.log(`Query without date filter:`, JSON.stringify(queryWithoutDate, null, 2));
    }
      // First, let's check what data exists in the collection without filters
    const totalCount = await db.collection(collection).countDocuments();
    console.log(`Total documents in ${collection}: ${totalCount}`);
    
    // Verificar si la colección existe y tiene documentos
    if (totalCount === 0) {
      console.log(`ADVERTENCIA: La colección ${collection} está vacía.`);
      
      // Listar todas las colecciones para verificar el nombre correcto
      const collections = await db.listCollections().toArray();
      console.log('Colecciones disponibles:', collections.map(c => c.name));
      
      // Comprobar si hay colecciones similares (por ejemplo, singular vs plural)
      const similarCollections = collections
        .filter(c => c.name.includes(collection.slice(0, 4)) || 
                    collection.includes(c.name.slice(0, 4)))
        .map(c => c.name);
      
      if (similarCollections.length > 0) {
        console.log(`Posibles colecciones alternativas: ${similarCollections.join(', ')}`);
      }
    }
    
    // Check how many documents belong to this user
    const userCount = await db.collection(collection).countDocuments({ userId: session.user.id });
    console.log(`Documents for user ${session.user.id}: ${userCount}`);
    
    // Si no hay documentos para este usuario, buscar otros documentos para entender la estructura
    if (userCount === 0 && totalCount > 0) {
      console.log('No hay documentos para este usuario. Analizando estructura de datos...');
      
      // Obtener algunos documentos de muestra de cualquier usuario
      const anySamples = await db.collection(collection).find().limit(3).toArray();
      console.log('Ejemplos de documentos disponibles:', anySamples);
      
      // Comprobar qué campos de ID de usuario se están usando
      const userIdFields = ['userId', 'user_id', 'createdBy', 'ownerId', 'credentialId'];
      userIdFields.forEach(field => {
        const hasField = anySamples.some(doc => doc[field]);
        if (hasField) {
          console.log(`Campo de ID de usuario encontrado: ${field}`);
          // Mostrar valores encontrados para este campo
          anySamples.forEach((doc, i) => {
            if (doc[field]) {
              console.log(`Documento ${i}, ${field}: ${doc[field]}`);
            }
          });
        }
      });
    }
    
    // If we have date filters, let's also check the date fields in the data
    if (dateFrom || dateTo) {
      console.log(`Date filtering requested: from=${dateFrom}, to=${dateTo}`);
      
      // Sample a few documents to see their date field structure
      let sampleDocs = [];
      
      // Intentar obtener documentos del usuario actual
      const userSamples = await db.collection(collection)
        .find({ userId: session.user.id })
        .limit(3)
        .toArray();
        
      if (userSamples.length > 0) {
        sampleDocs = userSamples;
      } else if (totalCount > 0) {
        // Si no hay documentos del usuario, tomar muestras generales
        sampleDocs = await db.collection(collection)
          .find()
          .limit(3)
          .toArray();
      }
      
      console.log(`Sample documents for date field analysis:`, sampleDocs.map(doc => {
        const { _id, fecha, createdAt, updatedAt, date, userId, createdBy } = doc;
        return { _id, fecha, createdAt, updatedAt, date, userId, createdBy };
      }));
      
      // Detectar todos los posibles campos de fecha
      if (sampleDocs.length > 0) {
        console.log('Detección de campos de fecha en el primer documento:');
        const dateFieldDetection = (obj, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (value instanceof Date) {
              console.log(`Campo de fecha encontrado: ${fullKey} = ${value}`);
            } else if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) {
              console.log(`Posible campo de fecha (string): ${fullKey} = ${value}`);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              dateFieldDetection(value, fullKey);
            }
          }
        };
        
        dateFieldDetection(sampleDocs[0]);
      }
    }
    
    // Execute the query
    const results = await db.collection(collection).find(query).toArray();
    console.log(`Query returned ${results.length} documents`);
    
    // Aplanar los resultados antes de enviarlos
    const flattenedResults = results.map(item => flattenObject(item));
    
    // Check existing reports count and implement auto-cleanup (max 10 reports)
    const existingReportsCount = await db.collection('reports').countDocuments({
      userId: session.user.id
    });
    
    console.log(`User has ${existingReportsCount} existing reports`);
    
    // If user already has 10 or more reports, delete the oldest ones
    if (existingReportsCount >= 10) {
      const reportsToDelete = Math.max(1, existingReportsCount - 9); // Keep 9, delete the rest
      console.log(`Deleting ${reportsToDelete} oldest reports to make room for new one`);
      
      // Find the oldest reports to delete
      const oldestReports = await db.collection('reports')
        .find({ userId: session.user.id })
        .sort({ createdAt: 1 }) // Oldest first
        .limit(reportsToDelete)
        .toArray();
      
      // Delete the oldest reports
      if (oldestReports.length > 0) {
        const reportIdsToDelete = oldestReports.map(report => report._id);
        await db.collection('reports').deleteMany({
          _id: { $in: reportIdsToDelete }
        });
        
        console.log(`Successfully deleted ${oldestReports.length} old reports:`, 
          oldestReports.map(r => ({ id: r._id, createdAt: r.createdAt, type: r.type }))
        );
      }
    }
    
    // Create a report entry to track this report
    const report = {
      type,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      machineId: machineId || null,
      workplace: workplace || null, // Add workplace information
      format: format || 'csv',
      recordCount: results.length,
      createdAt: new Date(),
      userId: session.user.id,
      status: 'completed',
      // Crear un fileUrl para que sea fácil de encontrar después
      fileUrl: `/api/reports/file/${new Date().getTime()}`, 
      // Incluir criterios de consulta para depuración
      query: JSON.stringify(query)
    };
    
    // Save report metadata
    const reportResult = await db.collection('reports').insertOne(report);
    
    // Prepare success response
    const successResponse = {
      success: true,
      reportId: reportResult.insertedId,
      message: `Generated ${flattenedResults.length} records`,
      data: flattenedResults
    };
    
    console.log('API returning success response:', { 
      success: successResponse.success, 
      reportId: successResponse.reportId, 
      message: successResponse.message,
      dataLength: successResponse.data.length 
    });
    
    // Return success with the report ID
    return NextResponse.json(successResponse);
    
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse = { 
      success: false, 
      error: error.message 
    };
    console.log('API returning error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Function to handle organizational reports for admins
async function handleOrganizationalReport(session, { category, fromDate, toDate, workplace, dateRange }) {
  try {
    console.log('[ADMIN] Generating organizational report:', { category, fromDate, toDate, workplace, dateRange });
    
    const db = await connectDB();
    
    // Calculate date range if not provided
    let startDate = fromDate;
    let endDate = toDate;
    
    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date();
      
      switch (dateRange) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          start.setMonth(now.getMonth() - 1); // Default to last month
      }
      
      startDate = start.toISOString();
      endDate = now.toISOString();
    }
    
    // Build user filter for organization
    let userFilter = {};
    
    if (session.user.role === 'ADMIN') {
      // Regular admin - filter by organization
      userFilter.organizationId = session.user.organizationId;
    }
    // SUPER_ADMIN sees all users (no filter)
    
    if (workplace && workplace !== 'all') {
      userFilter.workplaceName = workplace;
    }
    
    console.log('[ADMIN] User filter:', userFilter);
    
    // Get organization users
    const orgUsers = await db.collection('users').find(userFilter).toArray();
    const userIds = orgUsers.map(user => user._id.toString());
    
    console.log(`[ADMIN] Found ${orgUsers.length} users in organization`);
    
    // Initialize report data structure
    const reportData = [];
    const summary = {
      totalUsers: orgUsers.length,
      totalPrestarts: 0,
      totalMachines: 0,
      totalDiesel: 0
    };
    
    // Build date filter for collections
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Process each user
    for (const user of orgUsers) {
      const userData = {
        userId: user._id.toString(),
        userName: user.name || user.email,
        workplace: user.workplaceName || 'N/A',
        prestartCount: 0,
        machineCount: 0,
        dieselCount: 0,
        lastActivity: null
      };
      
      // Get prestart data if requested
      if (category === 'all' || category === 'prestart') {
        const prestartQuery = {
          userId: user._id.toString(),
          ...dateFilter
        };
        
        const prestarts = await db.collection('prestart').find(prestartQuery).toArray();
        userData.prestartCount = prestarts.length;
        summary.totalPrestarts += prestarts.length;
        
        if (prestarts.length > 0) {
          const latestPrestart = prestarts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          if (!userData.lastActivity || new Date(latestPrestart.createdAt) > new Date(userData.lastActivity)) {
            userData.lastActivity = latestPrestart.createdAt;
          }
        }
      }
      
      // Get machine data if requested
      if (category === 'all' || category === 'machine') {
        const machineQuery = {
          $or: [
            { userId: user._id.toString() },
            { createdBy: user._id.toString() }
          ],
          ...dateFilter
        };
        
        const machines = await db.collection('machines').find(machineQuery).toArray();
        userData.machineCount = machines.length;
        summary.totalMachines += machines.length;
        
        if (machines.length > 0) {
          const latestMachine = machines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          if (!userData.lastActivity || new Date(latestMachine.createdAt) > new Date(userData.lastActivity)) {
            userData.lastActivity = latestMachine.createdAt;
          }
        }
      }
      
      // Get diesel data if requested
      if (category === 'all' || category === 'diesel') {
        const dieselQuery = {
          userId: user._id.toString(),
          ...dateFilter
        };
        
        const dieselRecords = await db.collection('diesel_records').find(dieselQuery).toArray();
        userData.dieselCount = dieselRecords.length;
        summary.totalDiesel += dieselRecords.length;
        
        if (dieselRecords.length > 0) {
          const latestDiesel = dieselRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          if (!userData.lastActivity || new Date(latestDiesel.createdAt) > new Date(userData.lastActivity)) {
            userData.lastActivity = latestDiesel.createdAt;
          }
        }
      }
      
      reportData.push(userData);
    }
    
    // Sort by last activity (most recent first)
    reportData.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });
    
    // Create report record
    const report = {
      type: 'organizational',
      category: category,
      userId: session.user.id,
      createdAt: new Date(),
      params: {
        category,
        startDate,
        endDate,
        workplace: workplace || 'all',
        dateRange
      },
      summary,
      recordCount: reportData.length
    };
    
    const reportResult = await db.collection('reports').insertOne(report);
    
    console.log(`[ADMIN] Generated organizational report with ${reportData.length} user records`);
    
    return NextResponse.json({
      success: true,
      reportId: reportResult.insertedId,
      message: `Generated organizational report for ${reportData.length} users`,
      data: reportData,
      summary
    });
    
  } catch (error) {
    console.error('[ADMIN] Error generating organizational report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error generating organizational report: ' + error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow admins to use GET for organizational reports
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const dateRange = searchParams.get('dateRange');
    const workplace = searchParams.get('workplace');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'organizational') {
      return await handleOrganizationalReport(session, {
        category,
        fromDate: startDate,
        toDate: endDate,
        workplace,
        dateRange
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });

  } catch (error) {
    console.error('Error in GET reports/generate:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Function to handle specific organizational reports (org-prestart, org-service, etc.)
async function handleSpecificOrganizationalReport(session, { type, fromDate, toDate, workplace, dateRange }) {
  try {
    console.log('[ADMIN] Generating specific organizational report:', { type, fromDate, toDate, workplace, dateRange });
    
    const db = await connectDB();
    
    // Calculate date range if not provided
    let startDate = fromDate;
    let endDate = toDate;
    
    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date();
      start.setMonth(now.getMonth() - 1); // Default to last month
      startDate = start.toISOString();
      endDate = now.toISOString();
    }
    
    // Build user filter for organization
    let userFilter = {};
    
    if (session.user.role === 'ADMIN') {
      // Regular admin - filter by organization
      userFilter.organizationId = session.user.organizationId;
    }
    // SUPER_ADMIN sees all users (no filter)
    
    console.log('[ADMIN] User filter:', userFilter);
    
    // Get organization users
    const orgUsers = await db.collection('users').find(userFilter).toArray();
    const userIds = orgUsers.map(user => user._id.toString());
    
    console.log(`[ADMIN] Found ${orgUsers.length} users in organization`);
    
    // Build collection and query based on type
    let collection;
    let baseQuery = {};
    
    switch (type) {
      case 'prestart':
        collection = 'prestart';
        // Only apply date filters if explicitly provided by user
        if (fromDate && toDate) {
          baseQuery = {
            userId: { $in: userIds },
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        } else {
          // No date filters - get all prestarts for organization users
          baseQuery = {
            userId: { $in: userIds }
          };
        }
        break;
        
      case 'services':
        collection = 'services';
        // Only apply date filters if explicitly provided by user
        if (fromDate && toDate) {
          baseQuery = {
            userId: { $in: userIds },
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        } else {
          // No date filters - get all services for organization users
          baseQuery = {
            userId: { $in: userIds }
          };
        }
        break;
        
      case 'machine':
        collection = 'machines';
        // For machines, don't apply date filters as machines are persistent entities
        // Only apply date filters if explicitly provided by user
        if (fromDate && toDate) {
          baseQuery = {
            $or: [
              { userId: { $in: userIds } },
              { createdBy: { $in: userIds } }
            ],
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        } else {
          // No date filters - get all machines for organization users
          baseQuery = {
            $or: [
              { userId: { $in: userIds } },
              { createdBy: { $in: userIds } }
            ]
          };
        }
        break;
        
      case 'diesel':
        collection = 'diesel_records';
        // Only apply date filters if explicitly provided by user
        if (fromDate && toDate) {
          baseQuery = {
            userId: { $in: userIds },
            fecha: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        } else {
          // No date filters - get all diesel records for organization users
          baseQuery = {
            userId: { $in: userIds }
          };
        }
        break;
        
      default:
        throw new Error(`Unsupported organizational report type: ${type}`);
    }
    
    console.log(`[ADMIN] Querying ${collection} with:`, JSON.stringify(baseQuery, null, 2));
    
    // Fetch the data
    const data = await db.collection(collection).find(baseQuery).toArray();
    
    console.log(`[ADMIN] Found ${data.length} records for organizational ${type} report`);
    
    // Create a map of userId to user info for quick lookup
    const userMap = new Map();
    orgUsers.forEach(user => {
      userMap.set(user._id.toString(), {
        userName: user.name || user.email,
        workplaceName: user.workplaceName || 'N/A'
      });
    });
    
    // Enrich data with user workplace information
    const enrichedData = data.map(record => {
      const userId = record.userId || record.createdBy;
      const userInfo = userMap.get(userId?.toString());
      
      return {
        ...record,
        userName: userInfo?.userName || 'Unknown',
        workplaceName: userInfo?.workplaceName || 'N/A'
      };
    });
    
    console.log(`[ADMIN] Enriched ${enrichedData.length} records with workplace information`);
    
    // Save report metadata
    const reportDoc = {
      type: type, // Save the specific type (prestart, services, etc.)
      category: type,
      userId: session.user.id,
      createdAt: new Date(),
      params: {
        category: type,
        startDate: (fromDate && toDate) ? startDate : null,
        endDate: (fromDate && toDate) ? endDate : null,
        workplace: 'all', // Always 'all' for organizational reports
        dateRange
      },
      summary: {
        totalUsers: orgUsers.length,
        totalRecords: enrichedData.length,
        recordType: type
      },
      recordCount: enrichedData.length,
      query: JSON.stringify(baseQuery) // Save the query for download endpoint
    };
    
    const result = await db.collection('reports').insertOne(reportDoc);
    
    console.log(`[ADMIN] Generated organizational ${type} report with ${enrichedData.length} records`);
    
    return NextResponse.json({
      success: true,
      reportId: result.insertedId,
      message: `Generated ${enrichedData.length} ${type} records`,
      dataLength: enrichedData.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error generating specific organizational report:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


