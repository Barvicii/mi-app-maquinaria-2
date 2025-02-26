import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PreStart from '@/models/PreStart';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    console.log('Intentando eliminar PreStart con ID:', id);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID no proporcionado' 
      }, { status: 400 });
    }

    const prestart = await PreStart.findByIdAndDelete(id);
    
    if (!prestart) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registro no encontrado' 
      }, { status: 404 });
    }

    console.log('PreStart eliminado:', prestart);

    return NextResponse.json({ 
      success: true, 
      message: 'Registro eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error al eliminar PreStart:', error);
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
    const prestart = await PreStart.findById(id);
    
    if (!prestart) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registro no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: prestart 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}