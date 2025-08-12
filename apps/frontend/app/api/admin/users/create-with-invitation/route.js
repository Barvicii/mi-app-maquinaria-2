import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectDB } from "@/lib/mongodb";
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { generateTemporaryPassword, sendUserInvitationEmail } from "@/lib/emailUtils";

export async function POST(request) {
  try {
    console.log('🔧 Creating user with invitation email...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      console.log('❌ User is not admin or super admin:', session.user.role);
      return NextResponse.json(
        { error: 'Not authorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { name, email, role, workplaceName } = await request.json();

    console.log('📋 Creating user with invitation:', { name, email, role, workplaceName });

    if (!name || !email || !role || !workplaceName) {
      return NextResponse.json(
        { error: 'Name, email, role, and workplace name are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const organizationsCollection = db.collection('organizations');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Check user limit for non-super admins
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId) {
      console.log('🔍 Checking user limit for organization:', session.user.organizationId);
      
      // Get organization info
      const organization = await organizationsCollection.findOne({ 
        _id: new ObjectId(session.user.organizationId) 
      });
      
      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      // Count current users in organization
      const currentUserCount = await usersCollection.countDocuments({ 
        organizationId: session.user.organizationId 
      });

      if (currentUserCount >= organization.maxUsers) {
        console.log(`❌ User limit reached: ${currentUserCount}/${organization.maxUsers}`);
        return NextResponse.json(
          { 
            error: `User limit reached. Your organization can have a maximum of ${organization.maxUsers} users. Currently there are ${currentUserCount} users. Please contact your super administrator to increase the limit.`,
            currentUserCount,
            maxUsers: organization.maxUsers
          },
          { status: 403 }
        );
      }

      console.log(`✅ User limit check passed: ${currentUserCount + 1}/${organization.maxUsers}`);
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    console.log('🔑 Generated temporary password:', temporaryPassword);

    // Hash the password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Create user object
    const userData = {
      name,
      email,
      role,
      workplace: workplaceName, // Correct field name
      password: hashedPassword,
      temporaryPassword: true,
      passwordChangeRequired: true,
      temporaryPasswordCreated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      // Inherit organization data from the creating admin
      company: session.user.company,
      organizationId: session.user.organizationId,
      credentialId: session.user.credentialId,
      createdBy: session.user.id,
      // Initialize suspension fields
      organizationSuspended: false,
      organizationSuspendedAt: null,
      organizationSuspendedBy: null
    };

    // Insert user into database
    const result = await usersCollection.insertOne(userData);
    
    if (!result.insertedId) {
      throw new Error('Failed to create user in database');
    }

    console.log('✅ User created with ID:', result.insertedId);

    // Always send invitation email since this is the invitation endpoint
    console.log('📧 Sending invitation email...');
    const emailResult = await sendUserInvitationEmail(email, temporaryPassword);
    
    if (!emailResult.success) {
      console.error('❌ Failed to send invitation email:', emailResult.error);
      // Don't fail the user creation, just warn about email
    } else {
      console.log('✅ Invitation email sent successfully');
    }

    // Return success response (without password)
    const { password: _, ...userResponse } = userData;
    
    return NextResponse.json({
      success: true,
      message: `User ${name} created successfully. Invitation email sent.`,
      user: {
        ...userResponse,
        _id: result.insertedId
      },
      emailSent: emailResult?.success || false,
      emailError: emailResult?.success === false ? emailResult.error : null,
      temporaryPassword: temporaryPassword // Include for admin reference
    });

  } catch (error) {
    console.error('❌ Error creating user with invitation:', error);
    return NextResponse.json(
      { error: 'Error creating user', details: error.message },
      { status: 500 }
    );
  }
}


