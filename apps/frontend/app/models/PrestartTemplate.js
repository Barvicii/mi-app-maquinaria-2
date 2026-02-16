import mongoose from 'mongoose';

const CheckItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  critical: { type: Boolean, default: false } // If true, failing this check means machine cannot operate
}, { _id: false });

const PrestartTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  checkItems: { type: [CheckItemSchema], required: true },
  userId: { type: String },
  organizationId: { type: String },
  organizationName: { type: String },
  createdByAdmin: { type: Boolean, default: false },
  createdByUser: { type: String },
  createdByUserId: { type: String },
  isGlobal: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true,
  strict: false
});

export default mongoose.models.PrestartTemplate || mongoose.model('PrestartTemplate', PrestartTemplateSchema);
