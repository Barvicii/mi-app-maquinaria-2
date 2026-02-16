import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

/**
 * GET /api/invoices/summary — Cost summary per machine or organization
 * Query params: machineId, from, to, groupBy (machine|category|month)
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const groupBy = searchParams.get('groupBy') || 'category';

    const db = await connectDB();

    // Base match filter — only confirmed invoices
    const match = { status: 'Confirmed' };

    // Scope by organization
    if (session.user.role !== 'SUPER_ADMIN') {
      if (session.user.credentialId) {
        match.organizationId = new ObjectId(session.user.credentialId);
      }
    }

    if (machineId) {
      if (ObjectId.isValid(machineId)) {
        match.machineId = new ObjectId(machineId);
      } else {
        match.machineCustomId = machineId;
      }
    }

    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    let pipeline = [{ $match: match }];

    if (groupBy === 'category') {
      pipeline.push(
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$totalAmount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      );
    } else if (groupBy === 'machine') {
      pipeline.push(
        {
          $group: {
            _id: { machineId: '$machineId', machineCustomId: '$machineCustomId' },
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
            categories: { $addToSet: '$category' }
          }
        },
        { $sort: { totalAmount: -1 } }
      );
    } else if (groupBy === 'month') {
      pipeline.push(
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      );
    } else if (groupBy === 'vendor') {
      pipeline.push(
        {
          $group: {
            _id: '$vendor',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      );
    }

    const summary = await db.collection('invoices').aggregate(pipeline).toArray();

    // Also get overall totals
    const totalPipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          grandTotal: { $sum: '$totalAmount' },
          totalInvoices: { $sum: 1 },
          avgInvoice: { $avg: '$totalAmount' },
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' }
        }
      }
    ];
    const [totals] = await db.collection('invoices').aggregate(totalPipeline).toArray() || [{}];

    return NextResponse.json({
      summary,
      totals: totals || { grandTotal: 0, totalInvoices: 0, avgInvoice: 0 },
      groupBy,
      filters: { machineId, from, to }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error.message },
      { status: 500 }
    );
  }
}
