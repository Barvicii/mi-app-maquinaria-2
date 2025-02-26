import mongoose from 'mongoose';

const MaquinaSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  nombre: String,
  modelo: String,
  marca: String,
  serie: String,
  maquinariaId: String,
  anio: String,
  horasActuales: String,
  proximoService: String,
  aceiteMotor: {
    tipo: String,
    capacidad: String,
    marca: String
  },
  aceiteHidraulico: {
    tipo: String,
    capacidad: String,
    marca: String
  },
  aceiteTransmision: {
    tipo: String,
    capacidad: String,
    marca: String
  },
  filtros: {
    motor: String,
    motorMarca: String,
    transmision: String,
    transmisionMarca: String,
    combustible: String,
    combustibleMarca: String
  },
  neumaticos: {
    delanteros: {
      tamano: String,
      presion: String,
      marca: String
    },
    traseros: {
      tamano: String,
      presion: String,
      marca: String
    }
  }
}, {
  timestamps: true
});

const Maquina = mongoose.models.Maquina || mongoose.model('Maquina', MaquinaSchema);

export default Maquina;