import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const { templateIds } = await req.json();

    if (!templateIds || !Array.isArray(templateIds)) {
      return new Response(JSON.stringify({ error: 'Invalid templateIds' }), { status: 400 });
    }

    const db = await connectDB();
    
    // Buscar en templates de prestart
    const prestartTemplates = await db
      .collection('prestartTemplates')
      .find({ _id: { $in: templateIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, name: 1 })
      .toArray();

    // Buscar en templates de services si no se encuentran en prestart
    const serviceTemplates = await db
      .collection('serviceTemplates')
      .find({ _id: { $in: templateIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, name: 1 })
      .toArray();

    // Combinar resultados
    const templateMap = {};
    prestartTemplates.forEach(template => {
      templateMap[template._id.toString()] = template.name;
    });
    serviceTemplates.forEach(template => {
      if (!templateMap[template._id.toString()]) {
        templateMap[template._id.toString()] = template.name;
      }
    });

    return new Response(JSON.stringify({ templateMap }), { status: 200 });
  } catch (error) {
    console.error('Error fetching template names:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}


