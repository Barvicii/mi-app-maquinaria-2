import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
    model: String,
    brand: String,
    serialNumber: String,
    machineId: String,
    year: String,
    currentHours: Number,
    lastService: String,
    nextService: String,
    engineOil: {
        type: String,
        capacity: String,
        brand: String
    },
    hydraulicOil: {
        type: String,
        capacity: String,
        brand: String
    },
    transmissionOil: {
        type: String,
        capacity: String,
        brand: String
    },
    filters: {
        engine: String,
        engineBrand: String,
        transmission: String,
        transmissionBrand: String,
        fuel: String,
        fuelBrand: String
    },
    tires: {
        front: {
            size: String,
            pressure: String,
            brand: String
        },
        rear: {
            size: String,
            pressure: String,
            brand: String
        }
    }
}, {
    timestamps: true
});

// Ensure we don't create multiple models when the file is reloaded
const Machine = mongoose.models.Machine || mongoose.model('Machine', machineSchema);
export default Machine;