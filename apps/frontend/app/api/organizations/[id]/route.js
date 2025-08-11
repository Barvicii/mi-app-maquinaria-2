import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import Machine from '@/models/Machine';
import { ObjectId } from 'mongodb';

// GET - Obtener organización específica
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // Verificar permisos
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin puede ver cualquier organización
    } else if (session.user.role === 'admin') {
      // Admin solo puede ver su propia organización
      if (session.user.organizationId !== id) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const organization = await Organization.findById(id)
      .populate('adminId', 'name email')
      .populate('createdBy', 'name email');

    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Obtener usuarios de la organización
    const users = await User.find({ organizationId: id })
      .select('name email role createdAt active')
      .sort({ createdAt: -1 });

    // Obtener máquinas de la organización
    const machines = await Machine.find({ organizationId: id })
      .select('name model brand machineId createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      organization: {
        ...organization.toObject(),
        currentUserCount: users.length,
        machinesCount: machines.length
      },
      users,
      machines
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar organización (solo super_admin)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede actualizar configuración de organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const updateData = await request.json();

    await connectDB();

    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Validar que maxUsers no sea menor al número actual de usuarios
    if (updateData.maxUsers !== undefined) {
      const currentUserCount = await User.countDocuments({ organizationId: id });
      if (updateData.maxUsers < currentUserCount) {
        return NextResponse.json({
          error: `No se puede reducir el límite por debajo del número actual de usuarios (${currentUserCount})`
        }, { status: 400 });
      }
    }

    // Actualizar organización
    const updatedOrganization = await Organization.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('adminId', 'name email');

    return NextResponse.json({
      success: true,
      organization: updatedOrganization,
      message: 'Organización actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar organización (solo super_admin)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede eliminar organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Verificar que no tenga usuarios activos
    const userCount = await User.countDocuments({ organizationId: id, active: true });
    if (userCount > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar una organización con usuarios activos'
      }, { status: 400 });
    }

    // Verificar que no tenga máquinas
    const machineCount = await Machine.countDocuments({ organizationId: id });
    if (machineCount > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar una organización con máquinas registradas'
      }, { status: 400 });
    }

    await Organization.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Organización eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
