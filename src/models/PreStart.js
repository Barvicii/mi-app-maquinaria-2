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
    type: String,   // Puede ser ObjectId o String dependiendo de tu implementación
    required: false, // Para mantener compatibilidad con registros existentes
    index: true      // Añadir índice para búsquedas eficientes
  },
  maquinaId: {       // Campo alternativo (mantener ambos por compatibilidad)
    type: String,
    required: false
  },
  maquina: {        // Nombre/modelo de la máquina para facilitar la visualización
    type: String,
    required: false
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