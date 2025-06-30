// api/files/[fileId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
   
    // Retrieve file from database
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            workspaceMemberships: {
              select: {
                workspaceId: true
              }
            }
          }
        }
      }
    });
   
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
   
    // Check access permission
    // 1. If they're the owner
    const isOwner = file.userId === session.user.id;
   
    // 2. Or if they're in the same workspace as the file owner
    let isInSameWorkspace = false;
   
    if (!isOwner && file.user?.workspaceMemberships) {
      // Get current user's workspace memberships
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        select: { workspaceId: true }
      });
     
      const userWorkspaceIds = userWorkspaces.map(w => w.workspaceId);
      const fileOwnerWorkspaceIds = file.user.workspaceMemberships.map(w => w.workspaceId);
     
      // Check if there's any overlap in workspace memberships
      isInSameWorkspace = fileOwnerWorkspaceIds.some(id => userWorkspaceIds.includes(id));
    }
   
    if (!isOwner && !isInSameWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
   
    // Create a response with the file data
    const response = new NextResponse(file.fileData);
   
    // Set appropriate headers
    response.headers.set("Content-Type", file.fileType);
    response.headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
    response.headers.set("Cache-Control", "public, max-age=31536000"); // Cache for a year
    response.headers.set("Content-Length", file.fileSize.toString());
   
    return response;
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add a DELETE method to remove files if needed
export async function DELETE(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
   
    // Retrieve file from database
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId }
    });
   
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
   
    // Check if user is the owner of the file
    if (file.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this file" }, { status: 403 });
    }
   
    // Delete the file
    await prisma.fileStorage.delete({
      where: { id: fileId }
    });
   
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// // Optional: Add thumbnail generation for images
// export async function GET(
//   req: Request,
//   { params }: { params: { fileId: string, thumbnail: string } }
// ) {
//   if (params.thumbnail !== 'thumbnail') {
//     return NextResponse.json({ error: "Invalid route" }, { status: 400 });
//   }
  
//   try {
//     const { fileId } = params;
//     const session = await auth();
    
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
    
//     // Retrieve file from database
//     const file = await prisma.fileStorage.findUnique({
//       where: { id: fileId }
//     });
    
//     if (!file || !file.fileType.startsWith('image/')) {
//       return NextResponse.json({ error: "Image not found" }, { status: 404 });
//     }
    
//     // In a real-world implementation, you'd generate a resized thumbnail here
//     // For now, we'll just return the original image
    
//     const response = new NextResponse(file.fileData);
//     response.headers.set("Content-Type", file.fileType);
//     response.headers.set("Cache-Control", "public, max-age=31536000");
    
//     return response;
//   } catch (error) {
//     console.error("Error retrieving thumbnail:", error);
//     return NextResponse.json(
//       { error: "Failed to retrieve thumbnail" },
//       { status: 500 }
//     );
//   }
// }