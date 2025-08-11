import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'USER'
  },
  // Organization reference
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  // For super_admin users, this field is null
  // For admin users, this is their organization
  // For regular users, this is their organization
  // Permisos personalizados (para excepciones a los roles estándar)
  customPermissions: {
    type: [String],
    default: []
  },
  credentialId: {
    type: String,
    default: null
  },
  plan: {
    type: String,
    default: 'free'
  },  active: {
    type: Boolean,
    default: true
  },
  organizationSuspended: {
    type: Boolean,
    default: false
  },
  organizationSuspendedAt: {
    type: Date,
    default: null
  },
  organizationSuspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastLogin: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  emailVerified: Boolean,
  requestId: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Información adicional
  profile: {
    phone: String,
    position: String,
    avatar: String
  },
  organization: {
    type: String,
    default: null
  },
  workplace: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;