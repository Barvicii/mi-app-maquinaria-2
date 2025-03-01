import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Machine from '@/models/Machine';

export async function GET() {
    try {
        await dbConnect();
        const machines = await Machine.find({}).sort({ createdAt: -1 });
        
        return NextResponse.json(machines, { 
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error) {
        console.error('Error fetching machines:', error);
        return NextResponse.json(
            { 
                error: 'Error al cargar las máquinas', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const data = await request.json();

        // Sanitize input data
        const sanitizedData = {
            model: data.model || '',
            brand: data.brand || '',
            serialNumber: data.serialNumber || '',
            machineId: data.machineId || '',
            year: data.year || '',
            currentHours: data.currentHours || '0',
            lastService: data.lastService || '',
            nextService: data.nextService || '',
            engineOil: {
                type: data.engineOil?.type || '',
                capacity: data.engineOil?.capacity || '',
                brand: data.engineOil?.brand || ''
            },
            hydraulicOil: {
                type: data.hydraulicOil?.type || '',
                capacity: data.hydraulicOil?.capacity || '',
                brand: data.hydraulicOil?.brand || ''
            },
            transmissionOil: {
                type: data.transmissionOil?.type || '',
                capacity: data.transmissionOil?.capacity || '',
                brand: data.transmissionOil?.brand || ''
            },
            filters: {
                engine: data.filters?.engine || '',
                engineBrand: data.filters?.engineBrand || '',
                transmission: data.filters?.transmission || '',
                transmissionBrand: data.filters?.transmissionBrand || '',
                fuel: data.filters?.fuel || '',
                fuelBrand: data.filters?.fuelBrand || ''
            },
            tires: {
                front: {
                    size: data.tires?.front?.size || '',
                    pressure: data.tires?.front?.pressure || '',
                    brand: data.tires?.front?.brand || ''
                },
                rear: {
                    size: data.tires?.rear?.size || '',
                    pressure: data.tires?.rear?.pressure || '',
                    brand: data.tires?.rear?.brand || ''
                }
            }
        };

        const machine = new Machine(sanitizedData);
        const savedMachine = await machine.save();

        return NextResponse.json(savedMachine, { 
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error creando máquina:', error);
        return NextResponse.json(
            { 
                error: 'Error al crear la máquina', 
                details: error.message,
                validationErrors: error.errors 
            }, 
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const data = await request.json();

        // Sanitize input data similar to POST method
        const sanitizedData = {
            model: data.model || '',
            brand: data.brand || '',
            serialNumber: data.serialNumber || '',
            machineId: data.machineId || '',
            year: data.year || '',
            currentHours: data.currentHours || '0',
            lastService: data.lastService || '',
            nextService: data.nextService || '',
            engineOil: {
                type: data.engineOil?.type || '',
                capacity: data.engineOil?.capacity || '',
                brand: data.engineOil?.brand || ''
            },
            hydraulicOil: {
                type: data.hydraulicOil?.type || '',
                capacity: data.hydraulicOil?.capacity || '',
                brand: data.hydraulicOil?.brand || ''
            },
            transmissionOil: {
                type: data.transmissionOil?.type || '',
                capacity: data.transmissionOil?.capacity || '',
                brand: data.transmissionOil?.brand || ''
            },
            filters: {
                engine: data.filters?.engine || '',
                engineBrand: data.filters?.engineBrand || '',
                transmission: data.filters?.transmission || '',
                transmissionBrand: data.filters?.transmissionBrand || '',
                fuel: data.filters?.fuel || '',
                fuelBrand: data.filters?.fuelBrand || ''
            },
            tires: {
                front: {
                    size: data.tires?.front?.size || '',
                    pressure: data.tires?.front?.pressure || '',
                    brand: data.tires?.front?.brand || ''
                },
                rear: {
                    size: data.tires?.rear?.size || '',
                    pressure: data.tires?.rear?.pressure || '',
                    brand: data.tires?.rear?.brand || ''
                }
            }
        };

        const updatedMachine = await Machine.findByIdAndUpdate(id, sanitizedData, {
            new: true,  // Return updated document
            runValidators: true  // Run model validation on update
        });

        if (!updatedMachine) {
            return NextResponse.json(
                { error: 'Máquina no encontrada' }, 
                { status: 404 }
            );
        }

        return NextResponse.json(updatedMachine, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error actualizando máquina:', error);
        return NextResponse.json(
            { 
                error: 'Error al actualizar la máquina', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        const deletedMachine = await Machine.findByIdAndDelete(id);

        if (!deletedMachine) {
            return NextResponse.json(
                { error: 'Máquina no encontrada' }, 
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Máquina eliminada correctamente', 
                deletedMachine 
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error eliminando máquina:', error);
        return NextResponse.json(
            { 
                error: 'Error al eliminar la máquina', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}