import mongoose from 'mongoose';

const suspensionLogSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['SUSPEND', 'UNSUSPEND'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  performedByEmail: {
    type: String,
    required: true
  },
  usersAffected: {
    type: Number,
    required: true
  },
  affectedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],  reason: {
    type: String,
    maxlength: 500
  },
  details: {
    type: String,
    maxlength: 2000
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  },
  emailNotificationsSent: {
    type: Boolean,
    default: false
  },
  emailErrors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    error: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
suspensionLogSchema.index({ organization: 1, createdAt: -1 });
suspensionLogSchema.index({ performedBy: 1, createdAt: -1 });
suspensionLogSchema.index({ createdAt: -1 });

// Virtual for duration calculation (if there's a corresponding unsuspend action)
suspensionLogSchema.virtual('suspensionDuration').get(function() {
  if (this.action !== 'SUSPEND') return null;
  
  // This would need to be populated with the corresponding UNSUSPEND action
  // Implementation depends on how you want to handle this
  return null;
});

// Static method to log suspension action
suspensionLogSchema.statics.logSuspensionAction = async function(data) {
  try {
    const logEntry = new this(data);
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Error logging suspension action:', error);
    throw error;
  }
};

// Static method to get suspension history for an organization
suspensionLogSchema.statics.getOrganizationHistory = async function(organization, options = {}) {
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate
  } = options;

  const query = { organization };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Static method to get admin activity history
suspensionLogSchema.statics.getAdminHistory = async function(adminId, options = {}) {
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate
  } = options;

  const query = { performedBy: adminId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Static method to get suspension statistics
suspensionLogSchema.statics.getSuspensionStats = async function(options = {}) {
  const {
    startDate,
    endDate,
    organization
  } = options;

  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (organization) {
    matchStage.organization = organization;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSuspensions: {
          $sum: { $cond: [{ $eq: ['$action', 'SUSPEND'] }, 1, 0] }
        },
        totalUnsuspensions: {
          $sum: { $cond: [{ $eq: ['$action', 'UNSUSPEND'] }, 1, 0] }
        },
        totalUsersAffected: { $sum: '$usersAffected' },
        uniqueOrganizations: { $addToSet: '$organization' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSuspensions: 1,
        totalUnsuspensions: 1,
        totalUsersAffected: 1,
        uniqueOrganizationsCount: { $size: '$uniqueOrganizations' }
      }
    }
  ]);

  return stats[0] || {
    totalSuspensions: 0,
    totalUnsuspensions: 0,
    totalUsersAffected: 0,
    uniqueOrganizationsCount: 0
  };
};

const SuspensionLog = mongoose.models.SuspensionLog || mongoose.model('SuspensionLog', suspensionLogSchema);

export default SuspensionLog;
