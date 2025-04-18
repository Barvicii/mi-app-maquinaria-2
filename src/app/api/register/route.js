import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// Add a GET handler to test if the route is accessible
export async function GET() {
  return NextResponse.json({ status: "Register API is working" });
}

export async function POST(request) {
  try {
    console.log("Register API called");
    
    // Parse request body and log it for debugging
    const body = await request.json().catch(err => {
      console.error("Failed to parse request body:", err);
      return {};
    });
    
    console.log("Register request data:", body);
    const { name, email, password, organization } = body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    try {
      // Connect to database
      const db = await connectDB();
      
      // Check if user already exists
      const existingUser = await db.collection("users").findOne({
        email: email.toLowerCase().trim()
      });

      if (existingUser) {
        console.log("User already exists");
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.collection("users").insertOne({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        organization: organization || 'Default',
        createdAt: new Date()
      });

      console.log("User created successfully:", result.insertedId);
      
      // Return success response without exposing password
      return NextResponse.json({
        success: true,
        userId: result.insertedId,
        message: "Registration successful"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}