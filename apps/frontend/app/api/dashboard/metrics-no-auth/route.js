import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    console.log('[API] GET /api/dashboard/metrics-no-auth');
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Usar consulta de administrador (sin filtros) para debug
    const baseQuery = {};
    
    console.log('[API] Using admin query (no filters)');
    
    // Obtener contadores para cada colección
    const machinesCount = await db.collection('machines').countDocuments(baseQuery) || 0;
    const operatorsCount = await db.collection('operators').countDocuments(baseQuery) || 0;
    const servicesCount = await db.collection('services').countDocuments(baseQuery) || 0;
    const prestartCount = await db.collection('prestart').countDocuments(baseQuery) || 0;
    
    console.log('[API] Basic counts:', {
      machines: machinesCount,
      operators: operatorsCount,
      services: servicesCount,
      prestarts: prestartCount
    });
    
    // Calcular métricas de diesel
    let dieselMetrics = {
      totalCapacity: 0,
      consumed: 0,
      remaining: 0,
      tanksCount: 0
    };
    
    try {
      // Obtener tanques de diesel
      const dieselTanks = await db.collection('dieseltanks')
        .find(baseQuery)
        .toArray();
      
      // Obtener registros de consumo de diesel
      const dieselRecords = await db.collection('dieselrecords')
        .find(baseQuery)
        .toArray();
      
      console.log('[API] Diesel data found:', {
        tanks: dieselTanks.length,
        records: dieselRecords.length
      });
      
      if (dieselTanks.length > 0) {
        let totalCapacity = 0;
        let totalConsumed = 0;
        
        dieselTanks.forEach(tank => {
          const capacity = parseFloat(tank.capacity) || 0;
          totalCapacity += capacity;
        });
        
        dieselRecords.forEach(record => {
          const consumed = parseFloat(record.litros || record.amount) || 0;
          totalConsumed += consumed;
        });
        
        const remaining = Math.max(0, totalCapacity - totalConsumed);
        
        dieselMetrics = {
          totalCapacity: Math.round(totalCapacity * 100) / 100,
          consumed: Math.round(totalConsumed * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          tanksCount: dieselTanks.length
        };
      }
      
      console.log('[API] Calculated diesel metrics:', dieselMetrics);
    } catch (dieselError) {
      console.error('[API] Error calculating diesel metrics:', dieselError);
    }
    
    // Obtener actividad reciente simplificada
    const recentActivity = [];
    
    // Construir respuesta
    const response = {
      machines: machinesCount,
      operators: operatorsCount,
      services: servicesCount,
      prestarts: prestartCount,
      pendingServices: 0,
      completedServices: servicesCount,
      recentActivity: recentActivity,
      // Métricas de diesel
      dieselTotalCapacity: dieselMetrics.totalCapacity,
      dieselConsumed: dieselMetrics.consumed,
      dieselRemaining: dieselMetrics.remaining,
      dieselTanksCount: dieselMetrics.tanksCount
    };
    
    console.log('[API] Dashboard metrics response (no auth):', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


