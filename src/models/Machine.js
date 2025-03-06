import mongoose from 'mongoose';

const MachineSchema = new mongoose.Schema({
    modelo: { 
        type: String, 
        required: true
    },
    serie: { 
        type: String, 
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    horasActuales: { 
        type: Number, 
        default: 0
    },
    proximoService: { 
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    strict: false,
    validateBeforeSave: true
});

export default mongoose.models.Machine || mongoose.model('Machine', MachineSchema);