import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/**
 * GET /api/public/machines/[id]/invoices — Public invoice summary for a machine
 * Returns only confirmed invoices with limited fields (no amounts for public)
 * Shows: count by category, last service date, total services count
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }

    const db = await connectDB();

    // Find the machine first
    let machineFilter;
    if (ObjectId.isValid(id)) {
      machineFilter = { $or: [{ _id: new ObjectId(id) }, { machineId: id }] };
    } else {
      machineFilter = { machineId: id };
    }

    const machine = await db.collection('machines').findOne(machineFilter);
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    // Get confirmed invoices summary — only counts, no dollar amounts
    const invoiceMatch = {
      machineId: machine._id,
      status: 'Confirmed'
    };

    const [categoryBreakdown, recentActivity] = await Promise.all([
      // Count by category
      db.collection('invoices').aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            lastDate: { $max: '$date' }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray(),

      // Last 5 service entries (dates and categories only — no amounts)
      db.collection('invoices')
        .find(invoiceMatch)
        .sort({ date: -1 })
        .limit(5)
        .project({
          _id: 0,
          date: 1,
          category: 1,
          vendor: 1,
          description: 1
        })
        .toArray()
    ]);

    const totalInvoices = categoryBreakdown.reduce((sum, c) => sum + c.count, 0);

    return NextResponse.json({
      machineId: machine.machineId || machine._id,
      totalServiceRecords: totalInvoices,
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c._id,
        count: c.count,
        lastDate: c.lastDate
      })),
      recentActivity
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice summary' },
      { status: 500 }
    );
  }
}
