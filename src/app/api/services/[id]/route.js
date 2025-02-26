import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    console.log('Intentando eliminar Service con ID:', id);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID no proporcionado' 
      }, { status: 400 });
    }

    const service = await Service.findByIdAndDelete(id);
    
    if (!service) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registro no encontrado' 
      }, { status: 404 });
    }

    console.log('Service eliminado:', service);

    return NextResponse.json({ 
      success: true, 
      message: 'Registro eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error al eliminar Service:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registro no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: service 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}