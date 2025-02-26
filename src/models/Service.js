import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  maquinaId: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  datos: {
    tipoService: {
      type: String,
      required: true
    },
    horasActuales: {
      type: String,
      required: true
    },
    horasProximoService: {
      type: String,
      required: true
    },
    tecnico: {
      type: String,
      required: true
    },
    trabajosRealizados: [{
      type: Number
    }],
    observaciones: {
      type: String,
      default: ''
    },
    repuestos: {
      type: String,
      default: ''
    },
    maquina: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Eliminar el modelo existente si existe
mongoose.models = {};

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);