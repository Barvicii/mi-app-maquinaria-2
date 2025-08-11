import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// GET - Obtener todos los refills del usuario
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = await connectDB();

    // Obtener todos los tanques del usuario primero
    const userTanks = await db.collection('dieseltanks').find({
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) }
      ]
    }).toArray();

    const tankIds = userTanks.map(tank => tank._id);

    // Obtener todos los refills de esos tanques
    const refills = await db.collection('diesel_refills').find({
      tankId: { $in: tankIds }
    }).sort({ refillDate: -1 }).toArray();

    // Enriquecer con información del tanque
    const enrichedRefills = refills.map(refill => {
      const tank = userTanks.find(tank => tank._id.equals(refill.tankId));
      return {
        ...refill,
        _id: refill._id.toString(),
        tankId: refill.tankId.toString(),
        tankName: tank?.name || 'Unknown',
        tankIdCode: tank?.tankId || 'N/A',
        workplace: refill.workplace || tank?.workplace || 'N/A'
      };
    });

    return NextResponse.json({
      success: true,
      refills: enrichedRefills
    });

  } catch (error) {
    console.error('Error obteniendo refills:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
