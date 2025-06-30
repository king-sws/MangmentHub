import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

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

    // Check if file is an image
    if (!file.fileType.startsWith('image/')) {
      return NextResponse.json({ error: "Not an image file" }, { status: 400 });
    }

    // Check access permission (same as in file route)
    const isOwner = file.userId === session.user.id;
    let isInSameWorkspace = false;

    if (!isOwner && file.user?.workspaceMemberships) {
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        select: { workspaceId: true }
      });
      
      const userWorkspaceIds = userWorkspaces.map(w => w.workspaceId);
      const fileOwnerWorkspaceIds = file.user.workspaceMemberships.map(w => w.workspaceId);
      
      isInSameWorkspace = fileOwnerWorkspaceIds.some(id => userWorkspaceIds.includes(id));
    }

    if (!isOwner && !isInSameWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate thumbnail
    try {
      // Use sharp to resize the image
      const thumbnail = await sharp(file.fileData)
        .resize(200, 200, { fit: 'inside' })
        .toBuffer();

      // Create response with thumbnail
      const response = new NextResponse(thumbnail);
      
      // Set appropriate headers for the thumbnail
      response.headers.set("Content-Type", file.fileType);
      response.headers.set("Content-Disposition", `inline; filename="thumbnail-${encodeURIComponent(file.fileName)}"`);
      response.headers.set("Cache-Control", "public, max-age=31536000"); // Cache for a year
      
      return response;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      
      // Fallback to original image if thumbnail generation fails
      const response = new NextResponse(file.fileData);
      response.headers.set("Content-Type", file.fileType);
      response.headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
      response.headers.set("Cache-Control", "public, max-age=31536000");
      
      return response;
    }
  } catch (error) {
    console.error("Error retrieving thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail", details: (error as Error).message },
      { status: 500 }
    );
  }
}