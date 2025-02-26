import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Maquina from '@/models/Maquina';

export async function GET(request, context) {
  try {
    await dbConnect();
    // Acceder a params de manera asíncrona
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
    }

    console.log('Buscando máquina con ID:', id);

    const maquina = await Maquina.findOne({
      $or: [
        { _id: id },
        { id: id }
      ]
    });

    if (!maquina) {
      console.log('Máquina no encontrada para ID:', id);
      return NextResponse.json({ error: 'Máquina no encontrada' }, { status: 404 });
    }

    console.log('Máquina encontrada:', maquina);
    return NextResponse.json(maquina);

  } catch (error) {
    console.error('Error al buscar máquina:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    await dbConnect();
    
    const params = await context.params;
    const id = params.id;
    const updates = await request.json();
    
    console.log('Actualizando máquina:', id, updates);

    const maquina = await Maquina.findOneAndUpdate(
      { 
        $or: [
          { _id: id },
          { id: id }
        ]
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!maquina) {
      return NextResponse.json({ 
        success: false, 
        error: 'Máquina no encontrada' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: maquina 
    });

  } catch (error) {
    console.error('Error al actualizar máquina:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: 'ID no proporcionado' 
      }, { status: 400 });
    }

    console.log('Attempting to delete machine with ID:', id);

    const query = { $or: [{ id: id }, { _id: id }] };
    console.log('Delete query:', query);

    const maquina = await Maquina.findOneAndDelete(query);
    console.log('Delete result:', maquina);

    if (!maquina) {
      return NextResponse.json({ 
        success: false,
        error: 'Máquina no encontrada' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Máquina eliminada correctamente',
      data: maquina
    });

  } catch (error) {
    console.error('Error detallado al eliminar máquina:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Error al eliminar la máquina'
    }, { status: 500 });
  }
}