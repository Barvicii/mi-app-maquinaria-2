import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  tipo: String,
  telefono: String,
  email: String,
  fechaIngreso: Date,
  licencia: String,
  especialidad: String,
  activo: Boolean
}, {
  timestamps: true
});

export default mongoose.models.Operator || mongoose.model('Operator', operatorSchema);