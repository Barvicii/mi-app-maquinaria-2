import mongoose from 'mongoose';

const MachineSchema = new mongoose.Schema({
    model: { 
        type: String, 
        required: [true, 'El modelo de la máquina es requerido'],
        trim: true 
    },
    brand: { 
        type: String, 
        required: [true, 'La marca de la máquina es requerida'],
        trim: true 
    },
    serialNumber: { 
        type: String, 
        trim: true,
        default: '' 
    },
    machineId: { 
        type: String, 
        trim: true,
        default: '' 
    },
    year: { 
        type: String, 
        trim: true,
        default: '' 
    },
    currentHours: { 
        type: String, 
        default: '0',
        trim: true 
    },
    lastService: { 
        type: String, 
        default: '',
        trim: true 
    },
    nextService: { 
        type: String, 
        default: '',
        trim: true 
    },
    engineOil: {
        type: { type: String, default: '' },
        capacity: { type: String, default: '' },
        brand: { type: String, default: '' }
    },
    hydraulicOil: {
        type: { type: String, default: '' },
        capacity: { type: String, default: '' },
        brand: { type: String, default: '' }
    },
    transmissionOil: {
        type: { type: String, default: '' },
        capacity: { type: String, default: '' },
        brand: { type: String, default: '' }
    },
    filters: {
        engine: { type: String, default: '' },
        engineBrand: { type: String, default: '' },
        transmission: { type: String, default: '' },
        transmissionBrand: { type: String, default: '' },
        fuel: { type: String, default: '' },
        fuelBrand: { type: String, default: '' }
    },
    tires: {
        front: {
            size: { type: String, default: '' },
            pressure: { type: String, default: '' },
            brand: { type: String, default: '' }
        },
        rear: {
            size: { type: String, default: '' },
            pressure: { type: String, default: '' },
            brand: { type: String, default: '' }
        }
    }
}, {
    timestamps: true,
    // Cambiar esto a false o quitarlo para permitir campos adicionales
    strict: false,  
    validateBeforeSave: true
});

export default mongoose.models.Machine || mongoose.model('Machine', MachineSchema);