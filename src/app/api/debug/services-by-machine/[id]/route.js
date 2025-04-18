import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    const machineId = context.params.id;
    console.log("Verificando servicios para máquina:", machineId);
    
    if (!machineId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Intentar buscar usando el ID como ObjectId
    let query = {};
    try {
      if (ObjectId.isValid(machineId)) {
        query = { maquinaId: new ObjectId(machineId) };
      } else {
        query = { maquinaId: machineId };
      }
    } catch (error) {
      console.error("Error al convertir ID de máquina:", error);
      query = { maquinaId: machineId };
    }
    
    console.log("Consultando servicios con:", query);
    
    const services = await db.collection('services')
      .find(query)
      .toArray();
    
    console.log(`Se encontraron ${services.length} servicios para esta máquina`);
    
    // Intentar búsqueda más amplia si no se encontraron servicios
    if (services.length === 0) {
      console.log("Realizando búsqueda más amplia...");
      
      // Buscar todos los servicios e intentar encontrar por coincidencia en diferentes formatos
      const allServices = await db.collection('services')
        .find({})
        .limit(100)
        .toArray();
      
      const filteredServices = allServices.filter(service => {
        if (!service.maquinaId) return false;
        
        const serviceIdStr = typeof service.maquinaId === 'string' 
          ? service.maquinaId 
          : service.maquinaId.toString();
          
        return serviceIdStr.includes(machineId) || machineId.includes(serviceIdStr);
      });
      
      console.log(`Búsqueda amplia encontró ${filteredServices.length} servicios posibles`);
      
      if (filteredServices.length > 0) {
        return NextResponse.json({
          query,
          count: filteredServices.length,
          note: "Resultados de búsqueda amplia",
          services: filteredServices
        });
      }
    }
    
    return NextResponse.json({
      query,
      count: services.length,
      services
    });
  } catch (error) {
    console.error("Error al obtener servicios por máquina:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}