/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.string().length(0)),
  image: z.string().optional(),
});

export async function updateUserSettings(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", status: 401 };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const image = formData.get("image") as string;
    
    const data: Record<string, any> = {};
   
    // Only include fields that are provided and not empty
    if (name) data.name = name;
    if (email) data.email = email;
    if (image) data.image = image;
   
    // Hash password if provided
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    // Validate input
    const validation = updateUserSchema.safeParse({
      name: name || undefined,
      email: email || undefined,
      password: password || undefined,
      image: image || undefined,
    });

    if (!validation.success) {
      return {
        error: "Invalid data provided",
        status: 400,
        fieldErrors: validation.error.flatten().fieldErrors
      };
    }

    // Check if user is trying to change email and it's from a social provider
    if (email) {
      const userAccount = await prisma.account.findFirst({
        where: { userId: session.user.id }
      });

      if (userAccount && userAccount.provider !== "credentials") {
        return {
          error: "Cannot change email for accounts using social login",
          status: 400
        };
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    // Revalidate the profile and settings pages
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath(`/settings/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { error: "Failed to update settings", status: 500 };
  }
}