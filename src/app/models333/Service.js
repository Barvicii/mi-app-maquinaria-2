import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  tecnico: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  horasMaquina: { type: Number, required: true },
  tipoServicio: { type: String, required: true },
  proximoService: { type: Number, required: true },
  trabajosRealizados: { type: [String], default: [] },
  repuestos: { type: String, default: '' },
  observaciones: { type: String, default: '' },
  costo: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;