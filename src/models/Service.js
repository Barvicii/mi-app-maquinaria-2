import mongoose from 'mongoose';

const prestartSchema = new mongoose.Schema({
  horasMaquina: { type: String, required: true },
  operador: { type: String, required: true },
  observaciones: String,
  aceite: Boolean,
  agua: Boolean,
  neumaticos: Boolean,
  nivelCombustible: Boolean,
  lucesYAlarmas: Boolean,
  frenos: Boolean,
  extintores: Boolean,
  cinturonSeguridad: Boolean,
  fecha: { type: Date, default: Date.now },
  estado: { 
    type: String, 
    enum: ['OK', 'Requiere atención'],
    default: 'OK'
  },
  // New fields for user association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  organization: {
    type: String,
    default: 'Default'
  }
}, {
  timestamps: true
});

const PreStart = mongoose.models.PreStart || mongoose.model('PreStart', prestartSchema);
export default PreStart;