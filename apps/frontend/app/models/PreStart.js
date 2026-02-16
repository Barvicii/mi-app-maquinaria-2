import mongoose from 'mongoose';

const prestartSchema = new mongoose.Schema({
  // Core fields
  horasMaquina: { type: String, required: true },
  kilometerMileage: String,
  operador: { type: String, required: true },
  observaciones: String,

  // Dynamic check values (key-value pairs from template)
  checkValues: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Template reference
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PrestartTemplate' },

  // Legacy boolean fields (backward compatibility with existing records)
  aceite: Boolean,
  agua: Boolean,
  neumaticos: Boolean,
  nivelCombustible: Boolean,
  lucesYAlarmas: Boolean,
  frenos: Boolean,
  extintores: Boolean,
  cinturonSeguridad: Boolean,

  // Status & date
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['OK', 'Requiere atención'], default: 'OK' },
  hasCriticalFailure: { type: Boolean, default: false },

  // Equipment info
  equipmentType: { type: String, enum: ['machinery', 'vehicle'], default: 'machinery' },
  horasProximoService: String,
  kilometersProximoService: String,

  // Machine reference
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', index: true },
  maquinaId: String,
  maquina: String,

  // User & org
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: String, default: 'Default' },

  // Operator info (for linked operators)
  operadorInfo: {
    id: mongoose.Schema.Types.ObjectId,
    nombre: String,
    apellido: String
  }
}, {
  timestamps: true,
  strict: false
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