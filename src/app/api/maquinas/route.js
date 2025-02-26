import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Maquina from '@/models/Maquina';

export async function POST(request) {
    try {
      await dbConnect();
      
      // Obtener los datos del request
      const data = await request.json();
      console.log('Datos recibidos para crear máquina:', data);
      
      // Asegurarnos de que haya un ID
      if (!data.id) {
        data.id = Date.now().toString();
        console.log('ID generado:', data.id);
      }
      
      console.log('Intentando crear máquina con datos:', JSON.stringify(data, null, 2));
      
      // Crear la máquina en la base de datos
      const maquina = await Maquina.create(data);
      
      console.log('Máquina creada en MongoDB:', JSON.stringify(maquina, null, 2));
      
      return NextResponse.json(maquina, { status: 201 });
    } catch (error) {
      console.error('Error detallado al crear máquina:', error);
      
      if (error.code === 11000) {
        console.log('Error de duplicación:', error.keyPattern);
        return NextResponse.json({ 
          error: 'Ya existe una máquina con ese ID',
          details: error.message 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: 'Error al crear la máquina',
        details: error.message 
      }, { status: 500 });
    }
  }

export async function GET() {
  try {
    await dbConnect();
    
    console.log('Obteniendo todas las máquinas'); // Log para debugging
    
    const maquinas = await Maquina.find({}).sort({ createdAt: -1 });
    
    console.log(`Se encontraron ${maquinas.length} máquinas`); // Log para debugging
    
    return NextResponse.json(maquinas);
  } catch (error) {
    console.error('Error al obtener máquinas:', error);
    return NextResponse.json({ 
      error: 'Error al obtener las máquinas',
      details: error.message 
    }, { status: 500 });
  }
}

// Endpoint para actualizar múltiples máquinas
export async function PUT(request) {
  try {
    await dbConnect();
    const { maquinas } = await request.json();
    
    if (!Array.isArray(maquinas)) {
      return NextResponse.json({ 
        error: 'Se esperaba un array de máquinas' 
      }, { status: 400 });
    }
    
    // Actualizar cada máquina
    const actualizaciones = await Promise.all(
      maquinas.map(async (maquina) => {
        if (!maquina.id) {
          return { error: 'Máquina sin ID', maquina };
        }
        
        return await Maquina.findOneAndUpdate(
          { id: maquina.id },
          maquina,
          { new: true, upsert: true }
        );
      })
    );
    
    return NextResponse.json(actualizaciones);
  } catch (error) {
    console.error('Error al actualizar máquinas:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar las máquinas',
      details: error.message 
    }, { status: 500 });
  }
}

// Endpoint para eliminar todas las máquinas (¡usar con precaución!)
export async function DELETE(request) {
  try {
    await dbConnect();
    
    const result = await Maquina.deleteMany({});
    
    return NextResponse.json({ 
      message: `Se eliminaron ${result.deletedCount} máquinas` 
    });
  } catch (error) {
    console.error('Error al eliminar máquinas:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar las máquinas',
      details: error.message 
    }, { status: 500 });
  }
}