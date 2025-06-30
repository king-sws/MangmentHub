/* eslint-disable @typescript-eslint/no-explicit-any */
// api/workspaces/[workspaceId]/debug-complete/route.ts - Complete Debug Route
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorkspaceRole, hasPermission, ROLES, PERMISSIONS } from "@/lib/permission";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const workspaceId = params.workspaceId;

    console.log(`[COMPLETE_DEBUG] Starting debug for user: ${userId}, workspace: ${workspaceId}`);
    
    // Step 1: Raw database queries
    const rawWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        userId: true,
        createdAt: true
      }
    });

    const rawMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    console.log('[COMPLETE_DEBUG] Raw workspace:', rawWorkspace);
    console.log('[COMPLETE_DEBUG] Raw member:', rawMember);

    // Step 2: Check if member record exists with correct composite key
    const alternativeMemberCheck = await prisma.workspaceMember.findMany({
      where: {
        AND: [
          { userId: userId },
          { workspaceId: workspaceId }
        ]
      }
    });

    console.log('[COMPLETE_DEBUG] Alternative member check:', alternativeMemberCheck);

    // Step 3: Get all members for this workspace
    const allWorkspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('[COMPLETE_DEBUG] All workspace members:', allWorkspaceMembers);

    // Step 4: Test our permission functions
    const calculatedRole = await getUserWorkspaceRole(userId, workspaceId);
    console.log('[COMPLETE_DEBUG] Calculated role:', calculatedRole);

    // Step 5: Test specific permissions
    const permissionTests = {
      VIEW_BOARD: await hasPermission(userId, workspaceId, 'VIEW_BOARD'),
      CREATE_BOARD: await hasPermission(userId, workspaceId, 'CREATE_BOARD'),
      EDIT_BOARD: await hasPermission(userId, workspaceId, 'EDIT_BOARD'),
      DELETE_BOARD: await hasPermission(userId, workspaceId, 'DELETE_BOARD'),
    };

    console.log('[COMPLETE_DEBUG] Permission tests:', permissionTests);

    // Step 6: Get complete debug info
    const debugInfo = { message: "debugWorkspaceAccess is not available" };

    // Step 7: Database schema validation
    const memberTableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'WorkspaceMember'
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userData: session.user
      },
      rawQueries: {
        workspace: rawWorkspace,
        member: rawMember,
        alternativeMemberCheck,
        allWorkspaceMembers
      },
      calculations: {
        calculatedRole,
        permissionTests,
        isOwner: rawWorkspace?.userId === userId,
        memberExists: !!rawMember
      },
      debugInfo,
      systemInfo: {
        rolesConfig: ROLES,
        permissionsConfig: Object.keys(PERMISSIONS),
        memberTableStructure
      },
      recommendations: generateRecommendations(rawWorkspace, rawMember, userId, calculatedRole)
    });
  } catch (error) {
    console.error("[COMPLETE_DEBUG] Error:", error);
    return NextResponse.json(
      { 
        error: "Debug failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  workspace: any, 
  member: any, 
  userId: string, 
  calculatedRole: string | null
) {
  const recommendations = [];

  if (!workspace) {
    recommendations.push({
      issue: "Workspace not found",
      solution: "Check if the workspace ID is correct and exists in the database"
    });
  }

  if (workspace && workspace.userId !== userId && !member) {
    recommendations.push({
      issue: "User is not workspace owner and no member record exists",
      solution: "Add user to workspace using: INSERT INTO WorkspaceMember (userId, workspaceId, role) VALUES (?, ?, 'MEMBER')"
    });
  }

  if (member && !calculatedRole) {
    recommendations.push({
      issue: "Member record exists but role calculation failed",
      solution: "Check if the role value in database is valid (OWNER, ADMIN, MEMBER, GUEST)"
    });
  }

  if (member && member.role && !['OWNER', 'ADMIN', 'MEMBER', 'GUEST'].includes(member.role)) {
    recommendations.push({
      issue: `Invalid role in database: ${member.role}`,
      solution: "Update the role to a valid value: UPDATE WorkspaceMember SET role = 'MEMBER' WHERE id = ?"
    });
  }

  if (calculatedRole === 'MEMBER' || calculatedRole === 'ADMIN') {
    recommendations.push({
      issue: "Role calculation appears correct",
      solution: "Check permission function logic and ensure PERMISSIONS array includes the required role levels"
    });
  }

  return recommendations;
}

// Optional: Add a simple SQL fix endpoint
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, role = 'MEMBER' } = await req.json();
    const userId = session.user.id;
    const workspaceId = params.workspaceId;

    if (action === 'add_member') {
      // Add user as member if they're not already
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        }
      });

      if (existingMember) {
        return NextResponse.json({
          success: false,
          message: "User is already a member"
        });
      }

      const newMember = await prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId,
          role: role as any
        }
      });

      return NextResponse.json({
        success: true,
        message: "Member added successfully",
        data: newMember
      });
    }

    if (action === 'update_role') {
      const updatedMember = await prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        },
        data: {
          role: role as any
        }
      });

      return NextResponse.json({
        success: true,
        message: "Role updated successfully",
        data: updatedMember
      });
    }

    return NextResponse.json({
      success: false,
      message: "Invalid action"
    });
  } catch (error) {
    console.error("[DEBUG_FIX] Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Fix failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}