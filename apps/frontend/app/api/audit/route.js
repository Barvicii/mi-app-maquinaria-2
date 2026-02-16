import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const skip = (page - 1) * limit;
    const actionFilter = searchParams.get('action') || '';
    const userFilter = searchParams.get('userId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const db = await connectDB();

    const query = {};

    // Organization scoping — non-SUPER_ADMIN only see their own org's logs
    if (session.user.role !== 'SUPER_ADMIN') {
      const orgConditions = [];
      if (session.user.credentialId) {
        orgConditions.push({ organizationId: session.user.credentialId });
        orgConditions.push({ organizationId: new ObjectId(session.user.credentialId) });
      }
      if (session.user.organization) {
        orgConditions.push({ organization: session.user.organization });
      }
      if (session.user.company) {
        orgConditions.push({ organization: session.user.company });
      }
      // Also include logs with no org (legacy logs created before org tracking)
      orgConditions.push({ organization: { $exists: false } });
      orgConditions.push({ organization: null });

      if (orgConditions.length > 0) {
        query.$and = [{ $or: orgConditions }];
      }
    }

    // Use $and array to safely combine all filters
    if (!query.$and) query.$and = [];

    if (actionFilter) {
      query.$and.push({
        $or: [
          { action: { $regex: actionFilter, $options: 'i' } },
          { eventType: { $regex: actionFilter, $options: 'i' } },
        ]
      });
    }

    if (userFilter) {
      query.$and.push({
        $or: [
          { userId: userFilter },
          { userName: { $regex: userFilter, $options: 'i' } },
          { userEmail: { $regex: userFilter, $options: 'i' } },
          { 'metadata.email': { $regex: userFilter, $options: 'i' } },
        ]
      });
    }

    if (dateFrom || dateTo) {
      const dateQuery = {};
      if (dateFrom) dateQuery.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.timestamp = dateQuery;
    }

    // Clean up empty $and
    if (query.$and && query.$and.length === 0) delete query.$and;

    const [logs, total] = await Promise.all([
      db.collection('activityLogs')
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('activityLogs').countDocuments(query),
    ]);

    // Normalize log entries for consistent frontend display
    const normalizedLogs = logs.map(log => ({
      _id: log._id,
      action: log.action || log.eventType || 'unknown',
      category: log.actionCategory || log.category || 'general',
      userId: log.userId || log.metadata?.userId || null,
      userName: log.userName || log.metadata?.userName || null,
      userEmail: log.userEmail || log.metadata?.email || null,
      details: log.details || log.metadata || {},
      status: log.status || 'success',
      target: log.targetEntity || null,
      ipAddress: log.metadata?.ipAddress || null,
      source: log.metadata?.source || log.source || 'system',
      timestamp: log.timestamp || log.createdAt || log._id.getTimestamp(),
    }));

    return NextResponse.json({
      logs: normalizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
