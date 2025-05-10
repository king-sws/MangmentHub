
// app/api/lists/[listId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define schema for validation
const listUpdateSchema = z.object({
  title: z.string().min(1),
});

export async function PATCH(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const { listId } = params;
    
    if (!listId) {
      return new NextResponse("Missing listId", { status: 400 });
    }

    // Get and validate the request body
    const body = await req.json();
    const validatedData = listUpdateSchema.safeParse(body);
    
    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ error: validatedData.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: validatedData.data,
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("[LIST_PATCH]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const { listId } = params;

    if (!listId) {
      return new NextResponse("Missing listId", { status: 400 });
    }

    // Use a transaction to ensure atomicity
    await prisma.$transaction([
      prisma.card.deleteMany({
        where: { listId },
      }),
      prisma.list.delete({
        where: { id: listId },
      })
    ]);

    return NextResponse.json({ message: "List and all associated cards deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[LIST_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}