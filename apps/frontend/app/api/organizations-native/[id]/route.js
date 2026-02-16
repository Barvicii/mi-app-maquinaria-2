import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { dbConnect } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import User from "@/models/User";
import Machine from "@/models/Machine";

// GET - Obtener una organización específica
export async function GET(request, { params }) {
  try {
    console.log('🔄 Organization GET by ID - Request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede ver organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const { id: organizationId } = await params;
    
    const organization = await Organization.findById(organizationId)
      .populate('adminId', 'name email')
      .populate('createdBy', 'name email');

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get current user count
    const currentUserCount = await User.countDocuments({ organizationId: organization._id });
    
    // Buscar máquinas por organizationId O por organization (string)
    const currentMachineCount = await Machine.countDocuments({ 
      $or: [
        { organizationId: organization._id },
        { organization: organization.name }
      ]
    });
    
    console.log('🔄 GET Organization - Counts:', { 
      organizationId: organization._id, 
      organizationName: organization.name,
      currentUserCount, 
      currentMachineCount 
    });

    const orgWithCount = {
      ...organization.toObject(),
      currentUserCount,
      currentMachineCount
    };

    return NextResponse.json({
      success: true,
      organization: orgWithCount
    });

  } catch (error) {
    console.error('❌ Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una organización
export async function PUT(request, { params }) {
  try {
    console.log('🔄 Organization PUT - Update request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede editar organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { name, description, maxUsers, maxMachines, active, adminName, adminEmail } = await request.json();
    
    console.log('🔄 PUT Organization - Request data:', { 
      name, 
      description, 
      maxUsers, 
      maxMachines, 
      active,
      adminName,
      adminEmail
    });
    
    console.log('🔄 PUT Organization - Received data:', { name, description, maxUsers, maxMachines, active, adminName, adminEmail });
    
    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    if (maxUsers && maxUsers < 1) {
      return NextResponse.json(
        { error: 'Maximum users must be at least 1' },
        { status: 400 }
      );
    }

    if (maxMachines && maxMachines < 1) {
      return NextResponse.json(
        { error: 'Maximum machines must be at least 1' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const { id: organizationId } = await params;
    
    // Verificar que la organización existe
    const existingOrg = await Organization.findById(organizationId);
    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Si se está reduciendo maxUsers, verificar que no sea menor al número actual de usuarios
    if (maxUsers && maxUsers < existingOrg.maxUsers) {
      const currentUserCount = await User.countDocuments({ organizationId });
      
      if (maxUsers < currentUserCount) {
        return NextResponse.json({
          error: `Cannot reduce max users to ${maxUsers}. Organization currently has ${currentUserCount} users. Please remove users first or set a higher limit.`,
          currentUserCount,
          requestedMaxUsers: maxUsers
        }, { status: 400 });
      }
    }

    // Si se está reduciendo maxMachines, verificar que no sea menor al número actual de máquinas
    if (maxMachines && maxMachines < (existingOrg.maxMachines || 20)) {
      const currentMachineCount = await Machine.countDocuments({ 
        $or: [
          { organizationId },
          { organization: existingOrg.name }
        ]
      });
      
      console.log('🔄 PUT Validation - Machine count check:', {
        organizationId,
        organizationName: existingOrg.name,
        currentMachineCount,
        maxMachines,
        existingMaxMachines: existingOrg.maxMachines
      });
      
      if (maxMachines < currentMachineCount) {
        return NextResponse.json({
          error: `Cannot reduce max machines to ${maxMachines}. Organization currently has ${currentMachineCount} machines. Please remove machines first or set a higher limit.`,
          currentMachineCount,
          requestedMaxMachines: maxMachines
        }, { status: 400 });
      }
    }

    // Verificar que no exista otra organización con el mismo nombre (si se está cambiando)
    if (name !== existingOrg.name) {
      const duplicateOrg = await Organization.findOne({ 
        name, 
        _id: { $ne: organizationId } 
      });
      
      if (duplicateOrg) {
        return NextResponse.json(
          { error: 'An organization with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Actualizar la organización
    const updateData = {
      name,
      description: description || '',
      updatedAt: new Date()
    };

    if (maxUsers !== undefined) {
      updateData.maxUsers = maxUsers;
    }

    if (maxMachines !== undefined) {
      updateData.maxMachines = maxMachines;
    }

    console.log('🔄 PUT Organization - Update data:', updateData);

    if (active !== undefined) {
      updateData.active = active;
    }

    // Actualizar el administrador si se proporcionan datos
    if (adminName || adminEmail) {
      const adminUpdateData = {};
      if (adminName) adminUpdateData.name = adminName;
      if (adminEmail) adminUpdateData.email = adminEmail;
      
      if (Object.keys(adminUpdateData).length > 0) {
        await User.findByIdAndUpdate(
          existingOrg.adminId,
          adminUpdateData,
          { new: true }
        );
        console.log('✅ Administrator updated successfully:', adminUpdateData);
      }
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      updateData,
      { new: true }
    ).populate('adminId', 'name email')
     .populate('createdBy', 'name email');

    console.log('✅ Organization updated successfully');

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      message: 'Organization updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una organización
export async function DELETE(request, { params }) {
  try {
    console.log('🔄 Organization DELETE - Request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede eliminar organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const { id: organizationId } = await params;
    
    // Verificar que la organización existe
    const existingOrg = await Organization.findById(organizationId);
    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verificar que no tenga usuarios asignados
    const userCount = await User.countDocuments({ organizationId });
    if (userCount > 0) {
      return NextResponse.json({
        error: `Cannot delete organization. It has ${userCount} users assigned. Please remove all users first.`,
        userCount
      }, { status: 400 });
    }

    // Eliminar la organización
    await Organization.findByIdAndDelete(organizationId);

    console.log('✅ Organization deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Suspender/Activar organización
export async function PATCH(request, { params }) {
  try {
    console.log('🔄 Organization PATCH - Suspend/Activate request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede suspender/activar organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { active, action } = await request.json();
    
    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active parameter must be a boolean' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const { id: organizationId } = await params;
    
    // Verificar que la organización existe
    const existingOrg = await Organization.findById(organizationId);
    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Actualizar la organización
    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      { 
        active,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('adminId', 'name email')
     .populate('createdBy', 'name email');

    // Actualizar todos los usuarios de la organización
    const updateResult = await User.updateMany(
      { organizationId },
      {
        organizationSuspended: !active,
        organizationSuspendedAt: !active ? new Date() : null,
        organizationSuspendedBy: !active ? session.user.id : null,
        active: active, // Desactivar/activar usuarios junto con la organización
        updatedAt: new Date()
      }
    );

    // Si se está suspendiendo, obtener emails de usuarios afectados para invalidar sesiones
    let affectedUsers = [];
    if (!active) {
      affectedUsers = await User.find({ organizationId }, 'email _id name').lean();
    }

    console.log(`✅ Organization ${active ? 'activated' : 'suspended'} successfully`);
    console.log(`📊 ${updateResult.modifiedCount} users affected`);

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      usersAffected: updateResult.modifiedCount,
      affectedUsers: affectedUsers.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name
      })),
      message: `Organization ${active ? 'activated' : 'suspended'} successfully`,
      actionPerformedBy: session.user.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error suspending/activating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
