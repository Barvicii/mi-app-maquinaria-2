import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(JSON.stringify({ error: 'Invalid userIds' }), { status: 400 });
    }

    const db = await connectDB();

    // Buscar emails en la colección de usuarios
    const users = await db
      .collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, email: 1 })
      .toArray();

    // Buscar emails en la colección de operadores
    const operators = await db
      .collection('operators')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, email: 1 })
      .toArray();

    // Combinar resultados, priorizando operadores
    const emailMap = {};
    operators.forEach(op => {
      emailMap[op._id.toString()] = op.email;
    });
    users.forEach(user => {
      if (!emailMap[user._id.toString()]) {
        emailMap[user._id.toString()] = user.email;
      }
    });

    return new Response(JSON.stringify({ emailMap }), { status: 200 });
  } catch (error) {
    console.error('Error fetching user and operator emails:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}


