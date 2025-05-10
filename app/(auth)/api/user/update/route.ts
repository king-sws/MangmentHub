/* eslint-disable @typescript-eslint/no-explicit-any */

// FILE: app/api/user/update/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.string().length(0)),
  image: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Handle FormData submission
    const formData = await req.formData();
    const data: Record<string, any> = {};
    
    // Extract fields from FormData
    if (formData.has('name')) data.name = formData.get('name')?.toString();
    if (formData.has('email')) data.email = formData.get('email')?.toString();
    if (formData.has('password')) {
      const password = formData.get('password')?.toString();
      if (password && password.length > 0) {
        data.password = password;
      }
    }
    if (formData.has('image')) data.image = formData.get('image')?.toString();
    
    // Validate input
    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data provided", fieldErrors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    // Check if user is trying to update email with social login
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Determine if user is using social login
    const isSocialLogin = user.accounts.length > 0;
    
    // Don't allow email update for social login users
    if (data.email && isSocialLogin) {
      return NextResponse.json(
        { error: "Cannot change email for accounts using social login" },
        { status: 400 }
      );
    }
    
    // Prepare data for update
    const updateData: Record<string, any> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.image) updateData.image = data.image;
    
    // Hash password if provided
    if (data.password && data.password.length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true
      }
    });
    
    return NextResponse.json({
      user: updatedUser,
      message: "User updated successfully"
    });
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Check for unique constraint error (e.g., email already exists)
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Error updating user" },
      { status: 500 }
    );
  }
}