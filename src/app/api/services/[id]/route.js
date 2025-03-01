import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Service from '@/models/Service';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('GET service error:', error);
    return NextResponse.json(
      { error: 'Error loading service record' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await request.json();
    
    // Format the data if needed
    if (data.fecha) {
      data.fecha = new Date(data.fecha);
    }
    if (data.horasMaquina) {
      data.horasMaquina = Number(data.horasMaquina);
    }
    if (data.proximoService) {
      data.proximoService = Number(data.proximoService);
    }
    if (data.costo) {
      data.costo = Number(data.costo);
    }
    
    const updatedService = await Service.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedService) {
      return NextResponse.json(
        { error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('PUT service error:', error);
    return NextResponse.json(
      { error: 'Error updating service record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const deletedService = await Service.findByIdAndDelete(id);
    
    if (!deletedService) {
      return NextResponse.json(
        { error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Service record deleted successfully' }
    );
  } catch (error) {
    console.error('DELETE service error:', error);
    return NextResponse.json(
      { error: 'Error deleting service record' },
      { status: 500 }
    );
  }
}