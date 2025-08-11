import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { AuditService } from "@/lib/audit-service";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticación
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar permisos (solo administradores pueden registrar acciones manualmente)
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { action, category, details, target } = data;
    
    // Validar datos mínimos
    if (!action) {
      return NextResponse.json(
        { error: 'Falta acción a registrar' },
        { status: 400 }
      );
    }
    
    // Preparar datos para el registro
    const logData = {
      userId: session.user.id,
      userName: session.user.name || 'Unknown User',
      userEmail: session.user.email || 'unknown@email.com',
      action,
      actionCategory: category || 'client_action',
      details,
      status: 'success',
      targetEntity: {
        type: target?.type || 'client',
        id: target?.id || 'client-action',
        name: target?.name || 'Client Action'
      }
    };
    
    // Metadata con información del request
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      source: 'client'
    };
    
    // Registrar la acción
    const result = await AuditService.logAction(logData, metadata);
    
    if (!result.success) {
      throw new Error(result.error || 'Error al registrar acción');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Acción registrada correctamente',
      id: result.id
    });
  } catch (error) {
    console.error('Error en API de auditoría:', error);
    
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}


