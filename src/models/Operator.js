import mongoose from 'mongoose';

const OperatorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['operator', 'technician'],
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  fechaIngreso: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  licencia: {
    type: String,
    trim: true
  },
  especialidad: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure the model hasn't been compiled before
const Operator = mongoose.models.Operator || mongoose.model('Operator', OperatorSchema);

export default Operator;