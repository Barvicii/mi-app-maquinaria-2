import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { dbConnect } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import User from "@/models/User";

// GET - Verificar límite de usuarios para una organización
export async function GET(request) {
  try {
    console.log('🔄 User Limit Check API - GET request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Obtener información de la organización
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Solo admins de la organización o SUPER_ADMIN pueden verificar límites
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Contar usuarios actuales - usar el nombre de la organización (excluyendo ADMINs)
    console.log('🔍 Searching for users with organization name:', organization.name);
    
    const currentUserCount = await User.countDocuments({ 
      company: organization.name,
      role: { $ne: 'ADMIN' } // Excluir usuarios ADMIN del conteo
    });
    
    const canAddUsers = currentUserCount < organization.maxUsers;
    const remainingSlots = organization.maxUsers - currentUserCount;

    console.log(`📊 User limit check - Current: ${currentUserCount} (excluding admins), Max: ${organization.maxUsers}, Can add: ${canAddUsers}`);

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        maxUsers: organization.maxUsers,
        currentUserCount,
        canAddUsers,
        remainingSlots,
        usagePercentage: Math.round((currentUserCount / organization.maxUsers) * 100)
      }
    });

  } catch (error) {
    console.error('❌ Error checking user limit:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
