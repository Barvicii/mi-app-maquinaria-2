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
  machineId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: false,
    index: true
  },
  maquinaId: {
    type: String,
    required: false
  },
  maquina: {
    type: String,
    required: false
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

// Middleware para garantizar consistencia entre machineId y maquinaId
prestartSchema.pre('save', function(next) {
  // Si se proporciona maquinaId pero no machineId, usar maquinaId
  if (this.maquinaId && !this.machineId) {
    this.machineId = this.maquinaId;
  } 
  // Si se proporciona machineId pero no maquinaId, usar machineId
  else if (this.machineId && !this.maquinaId) {
    this.maquinaId = this.machineId;
  }
  next();
});

const PreStart = mongoose.models.PreStart || mongoose.model('PreStart', prestartSchema);
export default PreStart;