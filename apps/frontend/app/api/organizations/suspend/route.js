import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SuspensionLog from "@/models/SuspensionLog";
import { sendSuspensionNotification, sendAdminNotification } from "@/lib/emailService";

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can suspend organizations
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }    const { organization, suspend, reason, details } = await request.json();

    if (!organization) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    if (typeof suspend !== 'boolean') {
      return NextResponse.json({ error: 'Suspend parameter must be a boolean' }, { status: 400 });
    }

    // Validate reason for suspension (not required for unsuspension)
    if (suspend && !reason) {
      return NextResponse.json({ error: 'Reason is required for suspension' }, { status: 400 });
    }

    await connectDB();

    // Get users before updating them (for email notifications and logging)
    const affectedUsers = await User.find({
      $or: [
        { company: organization },
        { organization: organization }
      ]
    }).select('_id name email');

    if (affectedUsers.length === 0) {
      return NextResponse.json({ error: 'No users found for this organization' }, { status: 404 });
    }

    // Update all users in the organization
    const updateData = {
      organizationSuspended: suspend,
      organizationSuspendedAt: suspend ? new Date() : null,
      organizationSuspendedBy: suspend ? session.user.id : null
    };

    const result = await User.updateMany(
      { 
        $or: [
          { company: organization },
          { organization: organization }
        ]
      },
      updateData
    );

    // Get request metadata for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';    // Log the suspension action
    const logData = {
      organization,
      action: suspend ? 'SUSPEND' : 'UNSUSPEND',
      performedBy: session.user.id,
      performedByName: session.user.name,
      performedByEmail: session.user.email,
      usersAffected: result.modifiedCount,
      affectedUserIds: affectedUsers.map(user => user._id),
      reason: reason || null,
      details: details || null,
      metadata: {
        ipAddress,
        userAgent,
        sessionId: session.user.id // You could use actual session ID if available
      }
    };

    try {
      await SuspensionLog.logSuspensionAction(logData);
    } catch (logError) {
      console.error('Error logging suspension action:', logError);
      // Continue with the response even if logging fails
    }

    // Send email notifications (non-blocking)
    const emailPromises = [];
    
    // Send notifications to affected users
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      emailPromises.push(
        sendSuspensionNotification(
          affectedUsers,
          organization,
          session.user.name,
          suspend
        ).catch(error => {
          console.error('Error sending user notifications:', error);
          return { success: false, error: error.message };
        })
      );

      // Send admin notification
      emailPromises.push(
        sendAdminNotification(
          session.user.email,
          organization,
          result.modifiedCount,
          suspend
        ).catch(error => {
          console.error('Error sending admin notification:', error);
          return { success: false, error: error.message };
        })
      );
    }

    // Execute email sending in background
    Promise.allSettled(emailPromises).then(results => {
      const emailResults = results.map(result => result.value || result.reason);
      console.log('Email notification results:', emailResults);
      
      // Update the log with email notification status
      SuspensionLog.findOneAndUpdate(
        { 
          organization,
          performedBy: session.user.id,
          createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
        },
        { 
          emailNotificationsSent: emailResults.some(r => r && r.success),
          emailErrors: emailResults
            .filter(r => r && !r.success)
            .map(r => ({ error: r.error }))
        }
      ).catch(updateError => {
        console.error('Error updating log with email status:', updateError);
      });
    });    return NextResponse.json({ 
      message: `Organization ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      usersAffected: result.modifiedCount,
      organizationName: organization,
      actionPerformedBy: session.user.name,
      timestamp: new Date().toISOString(),
      emailNotificationsEnabled: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    });

  } catch (error) {
    console.error('Error updating organization suspension status:', error);
    
    // Log the error for debugging
    try {
      await SuspensionLog.create({
        organization: 'ERROR',
        action: 'ERROR',
        performedBy: session?.user?.id || 'unknown',
        performedByName: session?.user?.name || 'unknown',
        performedByEmail: session?.user?.email || 'unknown',
        usersAffected: 0,
        reason: `Error: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack
        }
      });
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}


