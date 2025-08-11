import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// GET - Get user's email settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await connectDB();
    const userId = session.user.id;
    
    console.log('[AlertSettings] GET request for user:', userId);
    
    // Get user's alert email settings
    const settings = await db.collection('userAlertSettings').findOne({ userId });
    
    console.log('[AlertSettings] Found settings in DB:', settings);
    
    // Default settings if none found
    const defaultSettings = {
      emails: [session.user.email].filter(Boolean),
      enablePrestartAlerts: true,
      enableServiceAlerts: true
    };
    
    const responseData = settings ? {
      emails: settings.emails || defaultSettings.emails,
      enablePrestartAlerts: settings.enablePrestartAlerts ?? defaultSettings.enablePrestartAlerts,
      enableServiceAlerts: settings.enableServiceAlerts ?? defaultSettings.enableServiceAlerts
    } : defaultSettings;
    
    console.log('[AlertSettings] Returning data:', responseData);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch email settings',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Save user's email settings
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const userId = session.user.id;
    
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = data.emails.filter(email => email && emailRegex.test(email));
    
    // Permitir array vacío de emails (usuario puede no querer notificaciones)
    console.log('[AlertSettings] Valid emails to save:', validEmails);
    
    const db = await connectDB();
    
    const settingsData = {
      userId,
      emails: validEmails,
      enablePrestartAlerts: data.enablePrestartAlerts ?? true,
      enableServiceAlerts: data.enableServiceAlerts ?? true,
      updatedAt: new Date()
    };
    
    // Upsert user settings
    const result = await db.collection('userAlertSettings').updateOne(
      { userId },
      { 
        $set: settingsData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    console.log('[AlertSettings] Settings saved for user:', userId);
    console.log('[AlertSettings] Database update result:', result);
    console.log('[AlertSettings] Settings data saved:', settingsData);
    
    return NextResponse.json({
      success: true,
      message: validEmails.length > 0 
        ? 'Email settings saved successfully' 
        : 'Email notifications disabled - no email addresses configured',
      settings: {
        emails: validEmails,
        enablePrestartAlerts: settingsData.enablePrestartAlerts,
        enableServiceAlerts: settingsData.enableServiceAlerts
      }
    });
    
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save email settings',
      details: error.message 
    }, { status: 500 });
  }
}


