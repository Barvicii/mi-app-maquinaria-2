import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    console.log("Registration attempt:", { name, email, passwordLength: password?.length });
    
    // Validations
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Create user
    const newUser = {
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(newUser);
    console.log("User created with ID:", result.insertedId);

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        _id: result.insertedId
      }
    });
    
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}