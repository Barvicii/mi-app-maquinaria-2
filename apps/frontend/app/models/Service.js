import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Preventivo', 'Correctivo', 'Emergencia', 'Mantenimiento'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  horasIniciales: {
    type: Number,
    required: true
  },
  horasFinales: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Pendiente', 'En Progreso', 'Completado', 'Cancelado'],
    default: 'Pendiente'
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: {
    type: Date
  },
  costoRepuestos: {
    type: Number,
    default: 0
  },
  costoManoObra: {
    type: Number,
    default: 0
  },
  repuestosUsados: [{
    nombre: String,
    cantidad: Number,
    costo: Number
  }],
  observaciones: String,
  organization: {
    type: String,
    default: 'Default'
  }
}, {
  timestamps: true
});

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;