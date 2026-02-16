import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
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

/**
 * GET /api/invoices/[id] — Get a single invoice
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const db = await connectDB();

    // Search by _id or invoiceId
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { invoiceId: id }] }
      : { invoiceId: id };

    const invoice = await db.collection('invoices').findOne(filter);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Scope check: non-SUPER_ADMIN can only see their org's invoices
    if (session.user.role !== 'SUPER_ADMIN') {
      const userOrgId = session.user.credentialId;
      const invoiceOrgId = invoice.organizationId?.toString();
      if (userOrgId && invoiceOrgId && userOrgId !== invoiceOrgId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id] — Update an invoice
 * ADMIN/SUPER_ADMIN can update status (confirm/reject)
 * Creator can update details while status is Pending Review
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid invoice ID is required" }, { status: 400 });
    }

    const db = await connectDB();
    const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(id) });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Scope check
    if (session.user.role !== 'SUPER_ADMIN') {
      const userOrgId = session.user.credentialId;
      const invoiceOrgId = invoice.organizationId?.toString();
      if (userOrgId && invoiceOrgId && userOrgId !== invoiceOrgId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    const data = await request.json();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isCreator = invoice.createdBy?.toString() === session.user.id;

    const updateFields = { updatedAt: new Date() };

    // Status changes — only ADMIN/SUPER_ADMIN
    if (data.status && ['Confirmed', 'Rejected', 'Pending Review'].includes(data.status)) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only administrators can change invoice status" },
          { status: 403 }
        );
      }
      updateFields.status = data.status;

      if (data.status === 'Confirmed') {
        updateFields.confirmedBy = new ObjectId(session.user.id);
        updateFields.confirmedAt = new Date();
      }
      if (data.status === 'Rejected') {
        updateFields.rejectionReason = data.rejectionReason || '';
        updateFields.confirmedBy = null;
        updateFields.confirmedAt = null;
      }
    }

    // Detail edits — allowed if Pending Review, or by admin
    if (invoice.status === 'Pending Review' || isAdmin) {
      if (data.vendor !== undefined) updateFields.vendor = data.vendor.trim();
      if (data.description !== undefined) updateFields.description = data.description.trim();
      if (data.date !== undefined) updateFields.date = new Date(data.date);
      if (data.category !== undefined) updateFields.category = data.category;
      if (data.totalAmount !== undefined) updateFields.totalAmount = Number(data.totalAmount);
      if (data.subtotal !== undefined) updateFields.subtotal = Number(data.subtotal);
      if (data.tax !== undefined) updateFields.tax = Number(data.tax);
      if (data.currency !== undefined) updateFields.currency = data.currency;
      if (data.items !== undefined) updateFields.items = data.items;
      if (data.imageUrl !== undefined) updateFields.imageUrl = data.imageUrl;

      // Machine assignment/reassignment
      if (data.machineId !== undefined) {
        if (data.machineId && ObjectId.isValid(data.machineId)) {
          updateFields.machineId = new ObjectId(data.machineId);
          updateFields.status = updateFields.status || 'Pending Review';
        } else if (data.machineId === null) {
          updateFields.machineId = null;
          updateFields.machineCustomId = null;
          updateFields.status = updateFields.status || 'Unassigned';
        }
        if (data.machineCustomId !== undefined) {
          updateFields.machineCustomId = data.machineCustomId;
        }
      }
    } else if (!data.status) {
      return NextResponse.json(
        { error: "Cannot edit a confirmed or rejected invoice. Only administrators can update it." },
        { status: 403 }
      );
    }

    await db.collection('invoices').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updated = await db.collection('invoices').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: updated
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id] — Delete an invoice
 * Only ADMIN/SUPER_ADMIN or the creator (while Pending)
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid invoice ID is required" }, { status: 400 });
    }

    const db = await connectDB();
    const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(id) });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isCreator = invoice.createdBy?.toString() === session.user.id;

    if (!isAdmin && !(isCreator && invoice.status === 'Pending Review')) {
      return NextResponse.json(
        { error: "Not authorized to delete this invoice" },
        { status: 403 }
      );
    }

    await db.collection('invoices').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: error.message },
      { status: 500 }
    );
  }
}
