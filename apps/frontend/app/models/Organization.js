import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  maxUsers: {
    type: Number,
    default: 10,
    min: 1
  },
  currentUserCount: {
    type: Number,
    default: 0
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  isMultiUser: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Configuration settings
  settings: {
    allowMachineSharing: {
      type: Boolean,
      default: false
    },
    requireApprovalForNewUsers: {
      type: Boolean,
      default: true
    }
  }
});

// Update the updatedAt field before saving
organizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for getting users count
organizationSchema.virtual('usersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

// Virtual for getting machines count
organizationSchema.virtual('machinesCount', {
  ref: 'Machine',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

export default Organization;
