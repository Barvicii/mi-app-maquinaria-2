import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    console.log('[API] GET /api/dashboard/metrics');
    
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);
    
    // Para debug: permitir acceso sin autenticación con datos completos
    let userId, credentialId, isAdmin;
    
    if (!session) {
      console.log('[API] No session found - using debug mode with admin privileges');
      isAdmin = true; // Para debug, dar permisos de admin
      userId = null;
      credentialId = null;
    } else {
      userId = session.user.id;
      credentialId = session.user.credentialId;
      isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    }
    
    console.log(`[API] Dashboard metrics - User: ${userId || 'debug'}, Admin: ${isAdmin}, CredentialId: ${credentialId || 'none'}`);
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Preparar consulta base basada en credenciales del usuario
    let baseQuery = {};
    
    // Solo filtrar si no es admin y hay sesión
    if (!isAdmin && session) {
      // Consulta base que funciona con todos los modelos
      baseQuery = {
        $or: [
          { userId: userId },
          { userId: ObjectId.isValid(userId) ? new ObjectId(userId) : null },
          { createdBy: userId },
          { createdBy: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
        ].filter(q => Object.values(q).every(v => v !== null))
      };
      
      // Añadir credentialId a la consulta si está disponible
      if (credentialId) {
        baseQuery.$or.push({ credentialId: credentialId });
      }
      
      // Incluir también elementos creados por "public_user" que estén asociados a máquinas del usuario
      const userMachines = await db.collection('machines')
        .find({ userId: userId })
        .project({ _id: 1 })
        .toArray();
        
      if (userMachines.length > 0) {
        const machineIds = userMachines.map(m => m._id.toString());
        baseQuery.$or.push({ 
          userId: "public_user", 
          maquinaId: { $in: machineIds } 
        });
      }
      
      console.log('[API] Base query for non-admin:', JSON.stringify(baseQuery));
    } else {
      console.log('[API] Admin user or debug mode - returning all metrics');
    }
    
    // Obtener contadores para cada colección correctamente - con manejo de errores
    let machinesCount = 0;
    let operatorsCount = 0;
    let servicesCount = 0;
    let prestartCount = 0;
    
    try {
      machinesCount = await db.collection('machines').countDocuments(baseQuery);
    } catch (error) {
      console.log('[API] Error counting machines:', error.message);
      machinesCount = 0;
    }
    
    try {
      operatorsCount = await db.collection('operators').countDocuments(baseQuery);
    } catch (error) {
      console.log('[API] Operators collection not found or error:', error.message);
      operatorsCount = 0;
    }
    
    try {
      prestartCount = await db.collection('prestart').countDocuments(baseQuery);
    } catch (error) {
      console.log('[API] Error counting prestarts:', error.message);
      prestartCount = 0;
    }
    
    // Contar servicios pendientes correctamente (valores positivos)
    let pendingServicesCount = 0;
    
    try {
      // Preparar consulta para servicios
      const servicesQuery = isAdmin ? {} : baseQuery;
      servicesCount = await db.collection('services').countDocuments(servicesQuery);
      
      pendingServicesCount = await db.collection('services').countDocuments({
        ...servicesQuery,
        status: { $in: ['Pending', 'Pendiente'] }
      });
    } catch (error) {
      console.log('[API] Services collection not found or error:', error.message);
      servicesCount = 0;
      pendingServicesCount = 0;
    }
    
    // Calcular completados como la diferencia (siempre valores positivos)
    const completedServicesCount = Math.max(0, servicesCount - pendingServicesCount);
    
    // Obtener actividad reciente (combinar servicios y prestarts) con manejo de errores
    let recentServices = [];
    let recentPrestarts = [];
    
    try {
      const servicesQuery = isAdmin ? {} : baseQuery;
      recentServices = await db.collection('services')
        .find(servicesQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
    } catch (error) {
      console.log('[API] Error fetching recent services:', error.message);
      recentServices = [];
    }
    
    try {
      recentPrestarts = await db.collection('prestart')
        .find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
    } catch (error) {
      console.log('[API] Error fetching recent prestarts:', error.message);
      recentPrestarts = [];
    }
    
    // Para los prestarts, necesitamos obtener el customId de la máquina
    let prestartMachines = [];
    const prestartMachineIds = recentPrestarts.map(p => p.maquinaId).filter(Boolean);
    
    try {
      if (prestartMachineIds.length > 0) {
        prestartMachines = await db.collection('machines')
          .find({ _id: { $in: prestartMachineIds.map(id => new ObjectId(id)) } })
          .project({ _id: 1, customId: 1, machineId: 1 })
          .toArray();
      }
    } catch (error) {
      console.log('[API] Error fetching prestart machines:', error.message);
      prestartMachines = [];
    }
    
    // Crear un mapa de machine IDs a custom IDs
    const machineIdToCustomId = {};
    prestartMachines.forEach(machine => {
      machineIdToCustomId[machine._id.toString()] = machine.customId || machine.machineId || machine._id.toString();
    });
    
    // Transformar datos para actividad reciente
    const formatServices = recentServices.map(service => ({
      type: 'service',
      title: `Service: ${service.tipoService || (service.datos?.tipoService) || 'Maintenance'}`,
      machineId: service.customMachineId || service.machineId || 
                (service.datos?.customMachineId || service.datos?.machineId || 'Unknown'),
      timestamp: service.createdAt || service.fecha || new Date(),
      status: service.status || 'Pending'
    }));
    
    const formatPrestarts = recentPrestarts.map(prestart => ({
      type: 'prestart',
      title: 'Pre-start Check',
      machineId: machineIdToCustomId[prestart.maquinaId] || prestart.maquinaId || 'Unknown',
      timestamp: prestart.createdAt || prestart.fecha || new Date(),
      status: 'Completed'
    }));
    
    // Combinar y ordenar por fecha (más reciente primero)
    const recentActivity = [...formatServices, ...formatPrestarts]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    // Calcular métricas de diesel
    console.log('[API] Calculating enhanced diesel metrics...');
    
    // MÉTRICAS DE DIESEL MEJORADAS - Información por tanque individual
    
    // 1. Obtener todos los tanques del usuario con detalles completos
    const dieselTanksQuery = isAdmin ? {} : {
      $or: [
        { userId: userId },
        { userId: ObjectId.isValid(userId) ? new ObjectId(userId) : null },
        { createdBy: userId },
        { createdBy: ObjectId.isValid(userId) ? new ObjectId(userId) : null },
        ...(credentialId ? [{ credentialId: credentialId }] : [])
      ].filter(q => Object.values(q).every(v => v !== null))
    };
    
    const dieselTanks = await db.collection('dieseltanks').find(dieselTanksQuery).toArray();
    
    // 2. Para cada tanque, calcular consumo y datos detallados
    const tanksWithDetails = [];
    let totalCapacity = 0;
    let totalCurrentLevel = 0;
    let totalConsumed = 0;
    
    for (const tank of dieselTanks) {
      // Obtener registros de consumo para este tanque
      // Los registros se guardan con tankId (string), no con _id del tanque
      const consumptionRecords = await db.collection('diesel_records').find({
        $and: [
          {
            $or: [
              { tankId: tank.tankId },        // tankId como string (ej: "FA_33")
              { tankId: tank._id },           // tankId como ObjectId (fallback)
              { tankId: tank._id.toString() } // tankId como string del ObjectId
            ]
          },
          {
            $or: [
              { userId: userId },
              { userId: userId.toString() },  // Convert ObjectId to string
              { userId: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
            ].filter(q => Object.values(q)[0] !== null)
          }
        ]
      }).toArray();
      
      console.log(`[Dashboard] Found ${consumptionRecords.length} consumption records for tank ${tank.tankId}`);
      
      // Calcular consumo total para este tanque
      const tankConsumed = consumptionRecords.reduce((total, record) => {
        return total + (parseFloat(record.litros) || 0); // Changed from quantity to litros
      }, 0);
      
      // Obtener última recarga
      const lastRefill = await db.collection('diesel_refills').findOne(
        { tankId: tank._id },
        { sort: { refillDate: -1 } }
      );
      
      // Obtener total de recargas
      const refillRecords = await db.collection('diesel_refills').find({
        tankId: tank._id
      }).toArray();
      
      const totalRefilled = refillRecords.reduce((total, refill) => {
        return total + (parseFloat(refill.liters) || 0);
      }, 0);
      
      const tankDetails = {
        _id: tank._id.toString(),
        name: tank.name,
        tankId: tank.tankId,
        location: tank.location,
        capacity: parseFloat(tank.capacity) || 0,
        currentLevel: parseFloat(tank.currentLevel) || 0,
        consumed: Math.round(tankConsumed * 100) / 100,
        totalRefilled: Math.round(totalRefilled * 100) / 100,
        percentageFull: Math.round(((parseFloat(tank.currentLevel) || 0) / (parseFloat(tank.capacity) || 1)) * 100),
        lastRefillDate: lastRefill?.refillDate || null,
        lastRefillAmount: lastRefill ? parseFloat(lastRefill.liters) : 0,
        consumptionRecordsCount: consumptionRecords.length,
        refillRecordsCount: refillRecords.length
      };
      
      tanksWithDetails.push(tankDetails);
      
      // Sumar totales
      totalCapacity += tankDetails.capacity;
      totalCurrentLevel += tankDetails.currentLevel;
      totalConsumed += tankDetails.consumed;
    }
    
    // 3. Calcular métricas generales
    const dieselRemaining = Math.max(0, totalCurrentLevel);
    const totalPercentageFull = totalCapacity > 0 ? Math.round((totalCurrentLevel / totalCapacity) * 100) : 0;
    
    console.log(`[API] Enhanced Diesel metrics:
      - Tanks: ${tanksWithDetails.length}
      - Total Capacity: ${totalCapacity}L
      - Current Level: ${totalCurrentLevel}L  
      - Total Consumed: ${totalConsumed}L
      - Percentage Full: ${totalPercentageFull}%`);
    
    tanksWithDetails.forEach(tank => {
      console.log(`  • ${tank.name}: ${tank.currentLevel}L/${tank.capacity}L (${tank.percentageFull}%)`);
    });

    // Construir respuesta con todas las métricas (incluye detalles por tanque)
    const response = {
      machines: machinesCount,
      operators: operatorsCount,
      services: servicesCount,
      prestarts: prestartCount,
      pendingServices: pendingServicesCount,
      completedServices: completedServicesCount,
      // Métricas de diesel mejoradas
      dieselTotalCapacity: Math.round(totalCapacity * 100) / 100,
      dieselCurrentLevel: Math.round(totalCurrentLevel * 100) / 100,
      dieselConsumed: Math.round(totalConsumed * 100) / 100,
      dieselRemaining: Math.round(dieselRemaining * 100) / 100,
      dieselTanksCount: tanksWithDetails.length,
      dieselTotalPercentageFull: totalPercentageFull,
      // NUEVO: Detalles individuales de cada tanque
      dieselTankDetails: tanksWithDetails,
      recentActivity: recentActivity
    };
    
    console.log('[API] Enhanced dashboard metrics response:', {
      ...response,
      dieselTankDetails: `${response.dieselTankDetails.length} tanks with details`
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


