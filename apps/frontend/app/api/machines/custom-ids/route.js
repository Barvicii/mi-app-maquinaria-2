import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const { machineIds } = await req.json();

    if (!machineIds || !Array.isArray(machineIds)) {
      return new Response(JSON.stringify({ error: 'Invalid machineIds' }), { status: 400 });
    }

    const db = await connectDB();
    
    // Convertir IDs válidos a ObjectId y mantener strings para otros
    const objectIds = [];
    const stringIds = [];
    
    machineIds.forEach(id => {
      if (ObjectId.isValid(id)) {
        objectIds.push(new ObjectId(id));
      }
      stringIds.push(id);
    });

    // Buscar máquinas por _id (ObjectId) y también por otros campos de ID
    const machines = await db
      .collection('machines')
      .find({
        $or: [
          { _id: { $in: objectIds } },
          { machineId: { $in: stringIds } },
          { maquinaId: { $in: stringIds } },
          { customId: { $in: stringIds } }
        ]
      })
      .project({ _id: 1, machineId: 1, maquinaId: 1, customId: 1 })
      .toArray();

    const customMachineMap = {};
    
    machines.forEach(machine => {
      const machineIdString = machine._id.toString();
      // Priorizar customId, luego machineId, luego maquinaId
      const customId = machine.customId || machine.machineId || machine.maquinaId || machineIdString;
      
      // Mapear el _id del documento con su customId
      customMachineMap[machineIdString] = customId;
      
      // También mapear otros campos de ID si existen
      if (machine.machineId) {
        customMachineMap[machine.machineId] = customId;
      }
      if (machine.maquinaId) {
        customMachineMap[machine.maquinaId] = customId;
      }
    });

    console.log('Machine custom ID mapping:', customMachineMap);

    return new Response(JSON.stringify({ customMachineMap }), { status: 200 });
  } catch (error) {
    console.error('Error fetching custom machine IDs:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}


