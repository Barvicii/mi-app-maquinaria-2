import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual', 'quarterly'],
    default: 'monthly'
  },
  description: {
    type: String,
    trim: true
  },
  features: {
    type: Object,
    default: {}
  },
  featureDescriptions: {
    type: Array,
    default: []
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
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
  }
}, {
  timestamps: true
});

const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);
export default Plan;
