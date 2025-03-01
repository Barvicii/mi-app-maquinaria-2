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
        type: {
            type: { type: String, default: '' },
            capacity: { type: String, default: '' },
            brand: { type: String, default: '' }
        },
        default: () => ({
            type: '',
            capacity: '',
            brand: ''
        })
    },
    hydraulicOil: {
        type: {
            type: { type: String, default: '' },
            capacity: { type: String, default: '' },
            brand: { type: String, default: '' }
        },
        default: () => ({
            type: '',
            capacity: '',
            brand: ''
        })
    },
    transmissionOil: {
        type: {
            type: { type: String, default: '' },
            capacity: { type: String, default: '' },
            brand: { type: String, default: '' }
        },
        default: () => ({
            type: '',
            capacity: '',
            brand: ''
        })
    },
    filters: {
        type: {
            engine: { type: String, default: '' },
            engineBrand: { type: String, default: '' },
            transmission: { type: String, default: '' },
            transmissionBrand: { type: String, default: '' },
            fuel: { type: String, default: '' },
            fuelBrand: { type: String, default: '' }
        },
        default: () => ({
            engine: '',
            engineBrand: '',
            transmission: '',
            transmissionBrand: '',
            fuel: '',
            fuelBrand: ''
        })
    },
    tires: {
        type: {
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
        },
        default: () => ({
            front: {
                size: '',
                pressure: '',
                brand: ''
            },
            rear: {
                size: '',
                pressure: '',
                brand: ''
            }
        })
    }
}, {
    timestamps: true,
    strict: 'throw',  // Helps prevent saving undefined fields
    validateBeforeSave: true
});

// Optional: Add custom validation
MachineSchema.pre('validate', function(next) {
    // You can add custom validation logic here if needed
    next();
});

export default mongoose.models.Machine || mongoose.model('Machine', MachineSchema);