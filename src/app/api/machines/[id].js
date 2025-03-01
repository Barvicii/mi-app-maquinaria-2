
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Machine from '@/models/Machine';

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

        // Intentar eliminar usando el ID proporcionado
        const machine = await Machine.findOneAndDelete({
            $or: [
              { _id: id },
              { id: id }
            ]
          });

        if (!maquina) {
            return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Máquina eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar máquina:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}