import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { headers } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = await connectDB();
    
    const machine = await db.collection('machines').findOne({
      _id: new ObjectId(id)
    });

    // Log what we found
    console.log('Found machine:', machine);
    
    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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