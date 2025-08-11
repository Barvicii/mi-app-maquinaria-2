import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await connectDB();
    
    // Obtener alertas del usuario
    const userAlerts = await db.collection('userAlerts')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    // Si no hay alertas, generamos algunas para probar
    if (userAlerts.length === 0) {
      // Obtener máquinas del usuario
      const machines = await db.collection('machines')
        .find({ userId: session.user.id })
        .toArray();
      
      // Obtener prestarts del usuario
      const prestarts = await db.collection('prestart')
        .find({ userId: session.user.id })
        .toArray();
      
      // Obtener services del usuario
      const services = await db.collection('services')
        .find({ userId: session.user.id })
        .toArray();
      
      const alerts = [];
      
      // Crear alertas de mantenimiento para máquinas
      if (machines.length > 0) {
        for (let i = 0; i < Math.min(3, machines.length); i++) {
          const machine = machines[i];
          
          // Alerta de próximo servicio
          const today = new Date();
          const nextServiceDate = new Date(today);
          nextServiceDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);
          
          alerts.push({
            userId: session.user.id,
            type: 'maintenance',
            severity: 'medium',
            title: 'Scheduled Maintenance',
            message: `Upcoming service for ${machine.model || machine.modelo} scheduled for ${nextServiceDate.toLocaleDateString()}`,
            machineId: machine._id.toString(),
            machineName: machine.model || machine.modelo,
            status: 'active',
            dueDate: nextServiceDate,
            createdAt: new Date(),
            read: false
          });
        }
      }
      
      // Crear alertas de prestarts con problemas
      if (prestarts.length > 0) {
        for (let i = 0; i < Math.min(2, prestarts.length); i++) {
          const prestart = prestarts[i];
          const machineId = prestart.machineId || prestart.maquinaId;
          
          // Buscar la máquina relacionada
          const machine = await db.collection('machines').findOne({ 
            $or: [
              { _id: new ObjectId(machineId) },
              { machineId: machineId },
              { maquinaId: machineId }
            ]
          });
          
          alerts.push({
            userId: session.user.id,
            type: 'prestart_issues',
            severity: 'high',
            title: 'Pre-Start Check Issues',
            message: `PreStart check for ${machine?.model || 'Machine'} reported problems that need attention`,
            machineId: machineId,
            machineName: machine?.model || 'Unknown Machine',
            prestartId: prestart._id.toString(),
            status: 'active',
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Hasta 1 día atrás
            read: Math.random() > 0.5
          });
        }
      }
      
      // Crear alertas de sistema
      alerts.push({
        userId: session.user.id,
        type: 'system',
        severity: 'low',
        title: 'System Notification',
        message: 'New features available in the application. Check the updates section.',
        status: 'active',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 259200000)), // Hasta 3 días atrás
        read: Math.random() > 0.3
      });
      
      // Guardar las alertas generadas
      if (alerts.length > 0) {
        await db.collection('userAlerts').insertMany(alerts);
        return NextResponse.json(alerts);
      }
      
      // Si no pudimos generar alertas, devolver array vacío
      return NextResponse.json([]);
    }
    
    // Si ya hay alertas, devolverlas
    return NextResponse.json(userAlerts);
    
  } catch (error) {
    console.error('Error retrieving alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validación de datos
    if (!data.message || !data.type || !data.status || !data.machine) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Crear alerta nueva
    const newAlert = {
      ...data,
      createdAt: new Date(),
      userId: session.user.id
    };
    
    const result = await db.collection('alerts').insertOne(newAlert);
    
    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...newAlert
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


