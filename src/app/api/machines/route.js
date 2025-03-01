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
                error: 'Error loading machines', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        // Ensure database connection
        await dbConnect();

        // Parse incoming JSON data
        const data = await request.json();
        console.log('Received machine data:', data);

        // Validate required fields
        if (!data.model || !data.brand) {
            return NextResponse.json(
                { 
                    error: 'Model and Brand are required fields',
                    details: {
                        model: data.model,
                        brand: data.brand
                    }
                }, 
                { status: 400 }
            );
        }

        // Sanitize input data - ensure all nested objects have default empty values
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

        // Create new machine
        const machine = new Machine(sanitizedData);
        
        // Save machine to database
        const savedMachine = await machine.save();

        console.log('Machine saved successfully:', savedMachine);

        // Return saved machine with 201 Created status
        return NextResponse.json(savedMachine, { 
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // Log full error for server-side debugging
        console.error('Error creating machine:', error);

        // Return a structured error response
        return NextResponse.json(
            { 
                error: 'Error creating machine',
                details: error.message,
                validationErrors: error.errors 
            }, 
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        // Ensure database connection
        await dbConnect();

        // Get machine ID from the request
        const { id } = params;

        // Parse incoming JSON data
        const data = await request.json();
        console.log('Received update data for machine:', id, data);

        // Validate required fields
        if (!data.model || !data.brand) {
            return NextResponse.json(
                { 
                    error: 'Model and Brand are required fields',
                    details: {
                        model: data.model,
                        brand: data.brand
                    }
                }, 
                { status: 400 }
            );
        }

        // Sanitize input data - ensure all nested objects have default empty values
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

        // Update machine in database
        const updatedMachine = await Machine.findByIdAndUpdate(
            id, 
            sanitizedData, 
            { 
                new: true,  // Return updated document
                runValidators: true  // Run model validation
            }
        );

        if (!updatedMachine) {
            return NextResponse.json(
                { error: 'Machine not found' }, 
                { status: 404 }
            );
        }

        console.log('Machine updated successfully:', updatedMachine);

        // Return updated machine
        return NextResponse.json(updatedMachine, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // Log full error for server-side debugging
        console.error('Error updating machine:', error);

        // Return a structured error response
        return NextResponse.json(
            { 
                error: 'Error updating machine',
                details: error.message,
                validationErrors: error.errors 
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
                { error: 'Machine not found' }, 
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Machine deleted successfully', 
                deletedMachine 
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting machine:', error);
        return NextResponse.json(
            { 
                error: 'Error deleting machine', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}