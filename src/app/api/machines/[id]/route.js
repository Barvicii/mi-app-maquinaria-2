import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Machine from '@/models/Machine';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        
        if (!id) {
            return NextResponse.json({ error: 'ID not provided' }, { status: 400 });
        }

        console.log('Searching for machine with ID:', id);

        const machine = await Machine.findById(id);

        if (!machine) {
            console.log('Machine not found for ID:', id);
            return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
        }

        console.log('Machine found:', machine);
        return NextResponse.json(machine);
    } catch (error) {
        console.error('Error finding machine:', error);
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const data = await request.json();
        
        console.log('Updating machine:', id);
        console.log('Update data:', JSON.stringify(data, null, 2));
        
        const machine = await Machine.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!machine) {
            return NextResponse.json({ 
                success: false, 
                error: 'Machine not found' 
            }, { status: 404 });
        }

        return NextResponse.json(machine);
    } catch (error) {
        console.error('Error updating machine:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            stack: error.stack,
            validationErrors: error.errors ? Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {}) : null
        }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        if (!id) {
            return NextResponse.json({ 
                success: false,
                error: 'ID not provided' 
            }, { status: 400 });
        }

        console.log('Attempting to delete machine with ID:', id);

        const machine = await Machine.findByIdAndDelete(id);
        
        if (!machine) {
            return NextResponse.json({ 
                success: false,
                error: 'Machine not found' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: 'Machine deleted successfully',
            data: machine
        });
    } catch (error) {
        console.error('Error deleting machine:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}