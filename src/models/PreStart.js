import mongoose from 'mongoose';

const PreStartSchema = new mongoose.Schema({
  maquinaId: {
    type: String,  // Cambiado a String
    required: true,
    ref: 'Maquina'
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  datos: {
    horasMaquina: String,
    aceite: Boolean,
    agua: Boolean,
    neumaticos: Boolean,
    nivelCombustible: Boolean,
    lucesYAlarmas: Boolean,
    frenos: Boolean,
    extintores: Boolean,
    cinturonSeguridad: Boolean,
    observaciones: String,
    operador: String,
    maquina: String
  }
}, {
  timestamps: true,
  strict: false
});

// Eliminar el modelo existente si existe
mongoose.models = {};

export default mongoose.models.PreStart || mongoose.model('PreStart', PreStartSchema);