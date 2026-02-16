import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { dbConnect } from "@/lib/mongodb";
import mongoose from 'mongoose';
import Organization from "@/models/Organization";
import User from "@/models/User";
import Machine from "@/models/Machine";

// GET - Obtener todas las organizaciones (solo super_admin)
export async function GET(request) {
  try {
    console.log('🔄 Organizations Native API - GET request received');
    
    const session = await getServerSession(authOptions);
    console.log('📊 Session status:', session ? 'Found' : 'Not found');
    console.log('📊 User role:', session?.user?.role);
    console.log('📊 User email:', session?.user?.email);
    
    if (!session) {
      console.log('❌ No session - returning 401');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔄 Connecting to database...');
    await dbConnect();
    console.log('✅ Database connected');
    
    // Verificar estado de la conexión
    console.log('📊 Mongoose connection state:', mongoose.connection.readyState);
    console.log('📊 Mongoose models:', Object.keys(mongoose.models));

    // Solo SUPER_ADMIN puede ver todas las organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      console.log(`❌ Access denied - user role: ${session.user.role}`);
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    console.log('🔄 Fetching organizations...');
    
    // Verificar que el modelo Organization esté disponible
    if (!mongoose.models.Organization) {
      console.log('❌ Organization model not found in mongoose.models');
      throw new Error('Organization model not found');
    }
    
    console.log('✅ Organization model found');
    
    // Intentar una consulta más simple primero
    console.log('🔄 Testing basic organizations query...');
    const organizationCount = await Organization.countDocuments({});
    console.log(`📊 Organization count: ${organizationCount}`);
    
    if (organizationCount === 0) {
      console.log('⚠️ No organizations found in database');
      return NextResponse.json({
        success: true,
        organizations: []
      });
    }
    
    // Intentar sin populate primero
    console.log('🔄 Fetching organizations without populate...');
    const organizationsBasic = await Organization.find({}).lean().limit(10);
    console.log(`📊 Found ${organizationsBasic.length} organizations (basic)`);
    
    // Ahora con populate
    console.log('🔄 Fetching organizations with populate...');
    const organizations = await Organization.find({})
      .populate('adminId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${organizations.length} organizations`);

    // Obtener conteos para cada organización
    console.log('🔄 Getting counts for organizations...');
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organizationId: org._id });
        
        // Buscar máquinas por organizationId O por organization (string)
        const machineCount = await Machine.countDocuments({ 
          $or: [
            { organizationId: org._id },
            { organization: org.name }
          ]
        });
        
        console.log(`📊 Org ${org.name}: users=${userCount}, machines=${machineCount}, orgId=${org._id}`);
        
        // Verificar si la organización está suspendida
        const suspendedUser = await User.findOne({ 
          organizationId: org._id,
          organizationSuspended: true 
        });
        
        return {
          ...org.toObject(),
          currentUserCount: userCount,
          currentMachineCount: machineCount,
          machinesCount: machineCount, // Keep for backward compatibility
          suspended: !!suspendedUser
        };
      })
    );

    console.log('✅ Organizations with counts processed successfully');
    console.log(`📊 Returning ${organizationsWithCounts.length} organizations`);

    return NextResponse.json({
      success: true,
      organizations: organizationsWithCounts
    });

  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva organización (solo super_admin)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede crear organizaciones
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { name, description, maxUsers, maxMachines, adminEmail, adminName, isMultiUser } = await request.json();

    if (!name || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Nombre de organización, email y nombre del admin son requeridos' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar que no exista una organización con el mismo nombre
    const existingOrg = await Organization.findOne({ name });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Ya existe una organización con ese nombre' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      );
    }

    // Determinar el rol del usuario basado en el tipo de organización
    const userRole = isMultiUser ? 'ADMIN' : 'USER';
    const finalMaxUsers = isMultiUser ? (maxUsers || 10) : 1;
    const finalIsMultiUser = isMultiUser && finalMaxUsers > 1; // Asegurar coherencia

    // Para single user, el workplace es el mismo que la organización
    const userWorkplace = finalIsMultiUser ? null : name;

    // Crear el usuario para la organización
    const newUser = new User({
      name: adminName,
      email: adminEmail,
      password: 'temp123', // Password temporal que debe cambiar
      role: userRole,
      organizationId: null, // Se asignará después de crear la organización
      organization: name, // Nombre de la organización
      workplace: userWorkplace, // Para single user = nombre org, para multi-user = null
      passwordChangeRequired: true, // Forzar cambio de contraseña en primer login
      temporaryPassword: true
    });

    const savedUser = await newUser.save();

    // Crear la organización
    const organization = new Organization({
      name,
      description: description || '',
      maxUsers: finalMaxUsers,
      maxMachines: maxMachines || 20, // Default 20 machines if not specified
      adminId: savedUser._id,
      createdBy: session.user.id,
      isMultiUser: finalIsMultiUser // Usar el valor corregido
    });

    const savedOrganization = await organization.save();

    // Actualizar el usuario con la referencia a la organización
    savedUser.organizationId = savedOrganization._id;
    await savedUser.save();

    return NextResponse.json({
      success: true,
      organization: savedOrganization,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        organization: savedUser.organization,
        workplace: savedUser.workplace
      },
      message: `Organization created successfully. ${userRole === 'ADMIN' ? 'Admin user' : 'User'} created with temporary password. ${finalIsMultiUser ? 'Multi-user organization' : 'Single-user organization with workplace set to organization name'}.`
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
