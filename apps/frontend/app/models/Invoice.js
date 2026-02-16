import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, default: 1 },
  precioUnitario: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  // Auto-generated ID (e.g. INV-2026-0001)
  invoiceId: {
    type: String,
    unique: true
  },

  // Machine reference
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    index: true
  },
  machineCustomId: String, // e.g. PO_TR03 for display

  // Invoice details
  date: { type: Date, required: true },
  vendor: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Spare Part', 'Service', 'Oil', 'Filter', 'Tire', 'Fuel', 'Other'],
    default: 'Other'
  },
  items: [InvoiceItemSchema],

  // Amounts
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'NZD', enum: ['NZD', 'AUD', 'USD'] },

  // Scanned image
  imageUrl: String,
  imageKey: String, // storage key for deletion

  // OCR/AI data
  ocrData: mongoose.Schema.Types.Mixed,
  ocrConfidence: { type: Number, min: 0, max: 100 },

  // Review status
  status: {
    type: String,
    enum: ['Pending Review', 'Confirmed', 'Rejected', 'Unassigned'],
    default: 'Pending Review'
  },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  rejectionReason: String,

  // Email reception metadata
  receivedViaEmail: { type: Boolean, default: false },
  emailMetadata: {
    from: String,
    subject: String,
    receivedAt: Date,
    messageId: String
  },

  // Ownership
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  organization: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  strict: false
});

// Auto-generate invoiceId before saving
InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceId) {
    const year = new Date().getFullYear();
    const Model = this.constructor;
    const count = await Model.countDocuments({ invoiceId: { $regex: `^INV-${year}-` } });
    this.invoiceId = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for common queries
InvoiceSchema.index({ machineId: 1, date: -1 });
InvoiceSchema.index({ organizationId: 1, status: 1 });
InvoiceSchema.index({ invoiceId: 1 });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
export default Invoice;
