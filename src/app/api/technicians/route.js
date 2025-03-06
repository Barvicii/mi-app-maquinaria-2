import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await connectDB();

    // Fetch technicians associated with the current user
    const technicians = await db.collection('operators')
      .find({ userId: userId })
      .toArray();

    console.log(`Found ${technicians.length} technicians for user ${userId}`);

    return NextResponse.json(technicians);

  } catch (error) {
    console.error('GET technicians error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch technicians' },
      { status: 500 }
    );
  }
}

// Replace the existing technician select in your form
<div>
  <label className="block text-sm font-medium text-gray-700">
    Technician
  </label>
  <select
    name="tecnico"
    value={serviceData.tecnico}
    onChange={handleChange}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    required
  >
    <option value="">Select technician...</option>
    {technicians.length > 0 ? (
      technicians.map((tech) => (
        <option 
          key={tech._id} 
          value={`${tech.nombre} ${tech.apellido}`}
        >
          {tech.nombre} {tech.apellido} - {tech.especialidad}
        </option>
      ))
    ) : (
      <option value="" disabled>No technicians available</option>
    )}
  </select>
  {technicians.length === 0 && (
    <p className="mt-1 text-sm text-red-600">
      No technicians found for your account
    </p>
  )}
</div>