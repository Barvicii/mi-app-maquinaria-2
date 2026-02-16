import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// Check organization suspension
const checkOrganizationSuspension = (session) => {
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationSuspended === true) {
    return NextResponse.json(
      { error: 'Organization is suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }
  return null;
};

const VALID_CATEGORIES = ['Spare Part', 'Service', 'Oil', 'Filter', 'Tire', 'Fuel', 'Other'];
const VALID_CURRENCIES = ['NZD', 'AUD', 'USD'];

/**
 * GET /api/invoices — List invoices with filters
 * Query params: machineId, status, category, from, to, page, limit, sort
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortField = searchParams.get('sort') || 'date';
    const sortOrder = searchParams.get('order') === 'asc' ? 1 : -1;

    const db = await connectDB();
    const filter = {};

    // Scope by organization (unless SUPER_ADMIN)
    if (session.user.role !== 'SUPER_ADMIN') {
      if (session.user.credentialId) {
        filter.organizationId = new ObjectId(session.user.credentialId);
      } else if (session.user.organization) {
        filter.organization = session.user.organization;
      }
    }

    // Optional filters
    if (machineId) {
      if (ObjectId.isValid(machineId)) {
        filter.machineId = new ObjectId(machineId);
      } else {
        filter.machineCustomId = machineId;
      }
    }

    if (status && ['Pending Review', 'Confirmed', 'Rejected', 'Unassigned'].includes(status)) {
      filter.status = status;
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const allowedSortFields = ['date', 'totalAmount', 'createdAt', 'invoiceId', 'vendor'];
    const actualSortField = allowedSortFields.includes(sortField) ? sortField : 'date';

    const [invoices, total] = await Promise.all([
      db.collection('invoices')
        .find(filter)
        .sort({ [actualSortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('invoices').countDocuments(filter)
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices — Create a new invoice
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const data = await request.json();

    // Validate required fields
    if (!data.vendor || !data.vendor.trim()) {
      return NextResponse.json({ error: "Vendor is required" }, { status: 400 });
    }
    if (!data.description || !data.description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (data.totalAmount === undefined || data.totalAmount === null || isNaN(Number(data.totalAmount))) {
      return NextResponse.json({ error: "Total amount is required and must be a number" }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ error: "Invoice date is required" }, { status: 400 });
    }

    const db = await connectDB();

    // Generate invoiceId
    const year = new Date().getFullYear();
    const count = await db.collection('invoices').countDocuments({
      invoiceId: { $regex: `^INV-${year}-` }
    });
    const invoiceId = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    // Build items array and compute subtotal
    const items = Array.isArray(data.items) ? data.items.map(item => ({
      nombre: String(item.nombre || '').trim(),
      cantidad: Number(item.cantidad) || 1,
      precioUnitario: Number(item.precioUnitario) || 0,
      total: Number(item.total) || (Number(item.cantidad || 1) * Number(item.precioUnitario || 0))
    })) : [];

    const subtotal = items.length > 0
      ? items.reduce((sum, item) => sum + item.total, 0)
      : Number(data.subtotal) || Number(data.totalAmount) || 0;

    const invoice = {
      invoiceId,
      date: new Date(data.date),
      vendor: data.vendor.trim(),
      description: data.description.trim(),
      category: VALID_CATEGORIES.includes(data.category) ? data.category : 'Other',
      items,
      subtotal,
      tax: Number(data.tax) || 0,
      totalAmount: Number(data.totalAmount),
      currency: VALID_CURRENCIES.includes(data.currency) ? data.currency : 'NZD',
      imageUrl: data.imageUrl || null,
      imageKey: data.imageKey || null,
      ocrData: data.ocrData || null,
      ocrConfidence: data.ocrConfidence != null ? Number(data.ocrConfidence) : null,
      status: data.machineId ? 'Pending Review' : 'Unassigned',
      receivedViaEmail: false,
      createdBy: new ObjectId(session.user.id),
      organization: session.user.organization || session.user.company || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Machine assignment
    if (data.machineId) {
      if (ObjectId.isValid(data.machineId)) {
        invoice.machineId = new ObjectId(data.machineId);
      }
      invoice.machineCustomId = data.machineCustomId || data.machineId;
    }

    // Organization scope
    if (session.user.credentialId) {
      invoice.organizationId = new ObjectId(session.user.credentialId);
    }

    const result = await db.collection('invoices').insertOne(invoice);

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice: { ...invoice, _id: result.insertedId }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    );
  }
}
