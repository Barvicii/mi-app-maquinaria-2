/**
 * GET/PUT /api/organization/settings
 * 
 * Organization-level settings that admins can configure from the UI.
 * Stored in the 'organizationSettings' collection, one doc per org.
 * 
 * Settings include:
 *  - Invoice email (where invoices are received)
 *  - WhatsApp number for notifications
 *  - CRON secret
 *  - Notification preferences
 */

import { connectDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

/**
 * GET /api/organization/settings — Get current org settings
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrators can view settings' }, { status: 403 });
    }

    const db = await connectDB();

    // Find settings for this org
    const orgId = session.user.credentialId;
    const orgName = session.user.organization || session.user.company;

    let settings = null;

    if (orgId) {
      settings = await db.collection('organizationSettings').findOne({
        $or: [
          { organizationId: orgId },
          { organizationId: new ObjectId(orgId) },
        ]
      });
    }

    if (!settings && orgName) {
      settings = await db.collection('organizationSettings').findOne({
        organization: orgName,
      });
    }

    // Return defaults if no settings exist yet
    if (!settings) {
      return NextResponse.json({
        settings: {
          invoiceEmail: '',
          invoiceEmailPassword: '',
          adminWhatsApp: '',
          whatsAppPhoneId: '',
          whatsAppAccessToken: '',
          cronSecret: '',
          notifyOnUnassignedInvoice: true,
          notifyViaEmail: true,
          notifyViaWhatsApp: true,
          autoProcessEmails: false,
          defaultCurrency: 'NZD',
          defaultCategory: 'Other',
          companyName: orgName || '',
        },
        isDefault: true,
      });
    }

    // Mask sensitive fields for display
    const maskedSettings = {
      ...settings,
      invoiceEmailPassword: settings.invoiceEmailPassword ? '••••••••' : '',
      whatsAppAccessToken: settings.whatsAppAccessToken ? '••••••••' : '',
      cronSecret: settings.cronSecret ? '••••••••' : '',
    };

    return NextResponse.json({ settings: maskedSettings, isDefault: false });
  } catch (error) {
    console.error('Error fetching org settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/organization/settings — Update org settings
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrators can update settings' }, { status: 403 });
    }

    const data = await request.json();
    const db = await connectDB();

    const orgId = session.user.credentialId;
    const orgName = session.user.organization || session.user.company;

    // Build the update object (only allow specific fields)
    const allowedFields = [
      'invoiceEmail',
      'invoiceEmailPassword',
      'adminWhatsApp',
      'whatsAppPhoneId',
      'whatsAppAccessToken',
      'cronSecret',
      'notifyOnUnassignedInvoice',
      'notifyViaEmail',
      'notifyViaWhatsApp',
      'autoProcessEmails',
      'defaultCurrency',
      'defaultCategory',
      'companyName',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Don't overwrite masked passwords with the mask string
        if (['invoiceEmailPassword', 'whatsAppAccessToken', 'cronSecret'].includes(field)) {
          if (data[field] === '••••••••' || data[field] === '') continue;
        }
        updateData[field] = data[field];
      }
    }

    updateData.updatedAt = new Date();
    updateData.updatedBy = session.user.id;

    // Upsert: create if not exists
    const filter = orgId
      ? { $or: [{ organizationId: orgId }, { organizationId: new ObjectId(orgId) }] }
      : { organization: orgName };

    const result = await db.collection('organizationSettings').updateOne(
      filter,
      {
        $set: updateData,
        $setOnInsert: {
          organizationId: orgId || null,
          organization: orgName || null,
          createdAt: new Date(),
          createdBy: session.user.id,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: 'Settings updated successfully',
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error) {
    console.error('Error updating org settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
