import mongoose from 'mongoose';

const MachineSchema = new mongoose.Schema({
    // Campos principales
    model: { 
        type: String, 
        required: true
    },
    modelo: { // Alias para compatibilidad
        type: String
    },
    brand: {
        type: String,
        required: true
    },
    serialNumber: { 
        type: String, 
        required: true
    },
    serie: { // Alias para compatibilidad
        type: String
    },
    machineId: {
        type: String,
        unique: true,
        required: true
    },
    year: {
        type: String
    },
    currentHours: {
        type: String
    },
    horasActuales: { // Alias para compatibilidad
        type: Number,
        default: 0
    },
    lastService: {
        type: String
    },
    nextService: {
        type: String
    },
    proximoService: { // Alias para compatibilidad
        type: Number
    },
    
    // Aceites
    engineOil: {
        type: {
            type: String
        },
        capacity: String,
        brand: String
    },
    hydraulicOil: {
        type: {
            type: String
        },
        capacity: String,
        brand: String
    },
    transmissionOil: {
        type: {
            type: String
        },
        capacity: String,
        brand: String
    },
    
    // Filtros
    filters: {
        engine: String,
        engineBrand: String,
        transmission: String,
        transmissionBrand: String,
        fuel: String,
        fuelBrand: String,
        air: String,
        airBrand: String,
        carbon: String,
        carbonBrand: String
    },
    
    // Filtros de aire/carbono para maquinaria química
    chemicalFilters: {
        hasFilters: {
            type: Boolean,
            default: false
        },
        filterType: {
            type: String,
            enum: ['air', 'carbon', 'both'],
            default: 'air'
        },
        expectedLifeHours: {
            type: Number,
            default: 100
        },
        currentFilters: [{
            type: {
                type: String,
                enum: ['air', 'carbon'],
                required: true
            },
            brand: String,
            partNumber: String,
            installationDate: {
                type: Date,
                required: true
            },
            installationHours: {
                type: Number,
                required: true
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],
        history: [{
            type: {
                type: String,
                enum: ['air', 'carbon']
            },
            brand: String,
            partNumber: String,
            installationDate: Date,
            installationHours: Number,
            replacementDate: Date,
            replacementHours: Number,
            replacedBy: String, // Técnico que lo reemplazó
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Service'
            }
        }]
    },
    
    // Llantas
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
    },
    
    // Relaciones
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // No siempre está presente en datos existentes
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null
    },
    prestartTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrestartTemplate'
    },
    credentialId: {
        type: String,
        default: null
    },
    
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    organization: {
        type: String,
        default: 'Default'
    },
    workplace: {
        type: String,
        default: 'N/A'
    }
}, {
    timestamps: true,
    strict: false,
    validateBeforeSave: true
});

// Middleware para sincronizar campos alias
MachineSchema.pre('save', function(next) {
    // Sincronizar model/modelo
    if (this.model && !this.modelo) {
        this.modelo = this.model;
    } else if (this.modelo && !this.model) {
        this.model = this.modelo;
    }
    
    // Sincronizar serialNumber/serie
    if (this.serialNumber && !this.serie) {
        this.serie = this.serialNumber;
    } else if (this.serie && !this.serialNumber) {
        this.serialNumber = this.serie;
    }
    
    next();
});

export default mongoose.models.Machine || mongoose.model('Machine', MachineSchema);