import mongoose from 'mongoose';

const AccessRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestType: {
    type: String,
    default: 'organization_registration'
  },
  accessLevel: {
    type: String,
    default: 'full'
  },
  registrationType: {
    type: String,
    default: 'direct_access'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  tempPassword: {
    type: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    registrationType: String
  }
}, {
  timestamps: true,
  collection: 'access_requests' // Especificar explícitamente el nombre de la colección
});

// Índices para mejorar el rendimiento
AccessRequestSchema.index({ email: 1 });
AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ submittedAt: -1 });

export default mongoose.models.AccessRequest || mongoose.model('AccessRequest', AccessRequestSchema);
