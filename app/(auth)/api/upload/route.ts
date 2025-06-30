import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// For App Router, we need this format for configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set to appropriate value for your server

export async function POST(req: Request) {
  try {
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
   
    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File;
   
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "File too large",
        details: "Maximum file size is 10MB"
      }, { status: 400 });
    }
   
    // Convert file to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
   
    // Store file in the database
    const fileRecord = await prisma.fileStorage.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: fileBuffer, // Store the actual file data
        userId: session.user.id
      }
    });
   
    // Return the file ID and URL for accessing the file
    const fileUrl = `/api/files/${fileRecord.id}`;
   
    // Generate thumbnail URL for images
    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = `/api/files/${fileRecord.id}/thumbnail`;
    }
   
    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileId: fileRecord.id,
      thumbnailUrl
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: (error as Error).message },
      { status: 500 }
    );
  }
}