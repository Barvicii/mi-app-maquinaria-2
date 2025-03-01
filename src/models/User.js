import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false, // Important: This hides the password by default
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'technician'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    default: null,
  },
  organization: {
    type: String,
    required: [true, 'Please provide an organization'],
  }
}, {
  timestamps: true
});

// Before saving, hash the password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Add association between user and machines/records
userSchema.virtual('machines', {
  ref: 'Machine',
  localField: '_id',
  foreignField: 'userId',
});

userSchema.virtual('prestarts', {
  ref: 'PreStart',
  localField: '_id',
  foreignField: 'userId',
});

userSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'userId',
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;