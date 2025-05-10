// app/workspace/[workspaceId]/members/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, ChevronLeft } from "lucide-react";
import { MembersList } from "@/components/MembersList";

// Function to get initials from a name
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default async function WorkspaceMembersPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  // First, check if the workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });

  if (!workspace) {
    return notFound();
  }

  // Check if user is the owner or member
  const isOwner = workspace.userId === userId;
  
  if (!isOwner) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: params.workspaceId,
      },
    });

    // If not a member either, return not found
    if (!membership) {
      return notFound();
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/workspace/${params.workspaceId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex items-center">
          <div className="bg-primary/10 w-10 h-10 rounded-md flex items-center justify-center mr-3">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{workspace.name} - Members</h1>
        </div>
      </div>

      {/* Render the client-side MembersList component */}
      <MembersList workspaceId={params.workspaceId} />
    </div>
  );
}