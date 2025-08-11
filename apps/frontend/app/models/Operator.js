import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Interno', 'Externo', 'Temporal'],
    default: 'Interno'
  },
  telefono: String,
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  licencia: String,
  especialidad: String,
  activo: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: String,
    default: 'Default'
  }
}, {
  timestamps: true
});

const Operator = mongoose.models.Operator || mongoose.model('Operator', operatorSchema);
export default Operator;