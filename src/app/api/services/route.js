import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Corregir la ruta de importación
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    console.log('[API] GET /api/services - Request received');
    
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const isPublic = searchParams.get('public') === 'true';
    
    // Get authenticated user if available
    let userId = null;
    let isAdmin = false;
    
    if (!isPublic) {
      try {
        const session = await getServerSession(authOptions);
        if (session && session.user) {
          userId = session.user.id;
          isAdmin = session.user.role === 'admin';
          console.log(`[API] Authenticated user: ${userId}, Admin: ${isAdmin}`);
        } else {
          console.log('[API] No authenticated session found');
        }
      } catch (err) {
        console.warn('[API] Error checking session:', err);
      }
    }
    
    const db = await connectDB();
    
    // Build query to include both machineId and maquinaId fields
    let query = {};
    
    if (machineId) {
      query.$or = [
        { machineId: machineId },
        { maquinaId: machineId },
        { 'datos.machineId': machineId },
        { 'datos.maquinaId': machineId }
      ];
    }
    
    // If this is a regular user (not admin), filter by credentials
    if (userId && !isAdmin) {
      console.log(`[API] Filtering services by user credentials: ${userId}`);
      
      // Get all machines created by this user
      const userMachines = await db.collection('machines')
        .find({ userId: userId })
        .project({ _id: 1, machineId: 1, maquinaId: 1, customId: 1 })
        .toArray();
      
      const userMachineIds = userMachines.map(m => {
        // Collect all possible machine identifiers
        const ids = [];
        if (m._id) ids.push(m._id.toString());
        if (m.machineId) ids.push(m.machineId);
        if (m.maquinaId) ids.push(m.maquinaId);
        if (m.customId) ids.push(m.customId);
        return ids;
      }).flat().filter(Boolean);
      
      console.log(`[API] User machine IDs: ${userMachineIds.join(', ')}`);
      
      // Include only:
      // 1. Services created by this user
      // 2. Services for machines created by this user
      // 3. Public services for machines created by this user
      
      if (Object.keys(query).length > 0) {
        // If we already have filters (like machineId), add credential filter with $and
        query = {
          $and: [
            query,
            {
              $or: [
                { userId: userId },
                { machineCreatorId: userId },
                { userId: "public_user", machineCreatorId: userId },
                { 
                  $or: [
                    { machineId: { $in: userMachineIds } },
                    { maquinaId: { $in: userMachineIds } },
                    { 'datos.machineId': { $in: userMachineIds } },
                    { 'datos.maquinaId': { $in: userMachineIds } },
                    { customId: { $in: userMachineIds } },
                    { 'datos.customId': { $in: userMachineIds } }
                  ]
                }
              ]
            }
          ]
        };
      } else {
        // If no other filters, use the credential filter directly
        query = {
          $or: [
            { userId: userId },
            { machineCreatorId: userId },
            { userId: "public_user", machineCreatorId: userId },
            { 
              $or: [
                { machineId: { $in: userMachineIds } },
                { maquinaId: { $in: userMachineIds } },
                { 'datos.machineId': { $in: userMachineIds } },
                { 'datos.maquinaId': { $in: userMachineIds } },
                { customId: { $in: userMachineIds } },
                { 'datos.customId': { $in: userMachineIds } }
              ]
            }
          ]
        };
      }
    } else if (isAdmin) {
      console.log('[API] Admin user - showing all services');
      // Admins see all services, no additional filtering needed
    } else if (isPublic && machineId) {
      console.log('[API] Public access with machineId - showing only related services');
      // For public access with a machineId, show only services for that machine
      // This is already handled by the machineId filter above
    } else if (isPublic) {
      console.log('[API] Public access without machineId - limiting results');
      // For public access without specific machineId, limit what's visible
      // Maybe show nothing or implement a token-based system
      return NextResponse.json([]); // Return empty array for general public access
    }
    
    console.log('[API] Final query:', JSON.stringify(query, null, 2));
    
    // Execute query
    const services = await db.collection('services')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[API] Found ${services.length} services`);
    
    // Process services to include machine details
    const processedServices = await Promise.all(services.map(async (service) => {
      // Get the machine ID for lookup
      const machineIdForLookup = service.machineId || service.maquinaId || 
        (service.datos && (service.datos.machineId || service.datos.maquinaId));
      
      // Only look up if we don't already have machine data
      if (machineIdForLookup && (!service.machine || !service.machine.machineId)) {
        try {
          let machineData;
          
          // First try by ObjectId
          if (ObjectId.isValid(machineIdForLookup)) {
            machineData = await db.collection('machines').findOne({ 
              _id: new ObjectId(machineIdForLookup) 
            });
          }
          
          // If not found, try by other IDs
          if (!machineData) {
            machineData = await db.collection('machines').findOne({
              $or: [
                { machineId: machineIdForLookup },
                { maquinaId: machineIdForLookup },
                { customId: machineIdForLookup }
              ]
            });
          }
          
          if (machineData) {
            // IMPORTANT: Save the custom machineId to multiple places for compatibility
            service.machineId = machineData.machineId || machineData.customId || machineIdForLookup;
            
            // Also set it on the machine object
            service.machine = {
              modelo: machineData.modelo || machineData.model || '',
              marca: machineData.marca || machineData.brand || '',
              machineId: machineData.machineId || machineData.customId || '',
              customId: machineData.machineId || machineData.customId || '',
              type: machineData.type || machineData.tipo || ''
            };
          }
        } catch (err) {
          console.error('[API] Error looking up machine:', err);
        }
      }
      
      return service;
    }));
    
    return NextResponse.json(processedServices);
  } catch (error) {
    console.error('[API] Error in services API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('[API] POST /api/services - Request received');
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log('[API] Services - Public access:', isPublic);
    
    let data;
    try {
      data = await request.json();
      console.log('[API] Services - Request data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[API] Services - JSON parse error:', e);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Validate required fields
    if (!data.machineId) {
      console.error('[API] Services - Missing machineId');
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Find machine information
    let machineCreatorId = null;
    let machine = null;
    
    try {
      // Try to find the machine by ObjectId or by other IDs
      if (ObjectId.isValid(data.machineId)) {
        machine = await db.collection('machines').findOne({ 
          _id: new ObjectId(data.machineId) 
        });
      }
      
      if (!machine) {
        machine = await db.collection('machines').findOne({
          $or: [
            { machineId: data.machineId },
            { maquinaId: data.machineId },
            { customId: data.machineId }
          ]
        });
      }
      
      if (machine) {
        machineCreatorId = machine.userId;
        // Save the custom machine ID for display purposes
        serviceData.customMachineId = machine.machineId || machine.customId || '';
        // Also add it to the datos object
        if (serviceData.datos) {
          serviceData.datos.customMachineId = machine.machineId || machine.customId || '';
        }
        console.log(`[API] Services - Found machine with custom ID: ${serviceData.customMachineId}`);
      } else {
        console.log('[API] Services - Machine not found in database');
      }
    } catch (error) {
      console.error('[API] Services - Error finding machine:', error);
    }
    
    // Determine userId for the service
    let userId;
    if (!isPublic) {
      try {
        // For authenticated requests
        const session = await getServerSession(authOptions);
        if (!session) {
          console.error('[API] Services - No auth session for non-public request');
          
          // Instead of returning 401, check if it should be treated as public
          if (data.source === 'public' || request.headers.get('x-from-qr') === 'true') {
            console.log('[API] Services - Request appears to be from QR, treating as public');
            isPublic = true;
            userId = machineCreatorId || "public_user";
          } else {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
          }
        } else {
          userId = session.user.id;
        }
      } catch (authError) {
        console.error('[API] Services - Auth error:', authError);
        
        // Fallback to public mode
        isPublic = true;
        userId = machineCreatorId || "public_user";
        console.log('[API] Services - Falling back to public mode due to auth error');
      }
    } else {
      // For public access, use the machine creator's ID or a placeholder
      userId = machineCreatorId || "public_user";
      console.log(`[API] Services - Using userId for public request: ${userId}`);
    }
    
    // Add metadata to the service record
    const serviceData = {
      ...data,
      userId: userId,
      machineCreatorId: machineCreatorId,
      createdAt: new Date(),
      source: isPublic ? 'public' : 'system',
      status: data.status || data.datos?.status || 'Pendiente'
    };
    
    // Ensure datos structure is consistent
    if (!serviceData.datos) {
      serviceData.datos = {};
    }
    
    if (!serviceData.datos.machineId && serviceData.machineId) {
      serviceData.datos.machineId = serviceData.machineId;
    }
    
    console.log('[API] Services - Final data to save:', JSON.stringify(serviceData, null, 2));
    
    // Save to database
    const result = await db.collection('services').insertOne(serviceData);
    console.log(`[API] Services - Record saved with ID: ${result.insertedId}`);
    
    return NextResponse.json({ 
      id: result.insertedId.toString(),
      success: true,
      message: "Service created successfully",
      machineCreator: machineCreatorId
    });
  } catch (error) {
    console.error('[API] Services - Unhandled error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to create service" 
    }, { status: 500 });
  }
}