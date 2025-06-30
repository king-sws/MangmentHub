/* eslint-disable @typescript-eslint/no-explicit-any */
// api/workspaces/[workspaceId]/debug-enhanced/route.ts
import { auth } from "@/auth";
import { getUserWorkspaceRole, hasPermission, ROLES, PERMISSIONS } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    console.log(`[ENHANCED_DEBUG] User: ${userId}, Workspace: ${workspaceId}`);

    // Step 1: Get workspace with full member data
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Step 2: Check ownership
    const isDirectOwner = workspace.userId === userId;
    const memberRecord = workspace.members.find(m => m.userId === userId);

    // Step 3: Get calculated role
    const calculatedRole = await getUserWorkspaceRole(userId, workspaceId);

    // Step 4: Test key permissions
    const permissions = {
      VIEW_BOARD: await hasPermission(userId, workspaceId, 'VIEW_BOARD'),
      CREATE_BOARD: await hasPermission(userId, workspaceId, 'CREATE_BOARD'),
      EDIT_BOARD: await hasPermission(userId, workspaceId, 'EDIT_BOARD'),
      DELETE_BOARD: await hasPermission(userId, workspaceId, 'DELETE_BOARD'),
      MANAGE_WORKSPACE: await hasPermission(userId, workspaceId, 'MANAGE_WORKSPACE'),
    };

    // Step 5: Identify the issue
    const diagnosis = diagnosePermissionIssue({
      userId,
      workspaceId,
      isDirectOwner,
      memberRecord,
      calculatedRole,
      permissions,
      workspace
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.userId
      },
      access: {
        isDirectOwner,
        memberRecord: memberRecord ? {
          id: memberRecord.id,
          role: memberRecord.role,
          joinedAt: memberRecord.createdAt
        } : null,
        calculatedRole,
        permissions
      },
      allMembers: workspace.members.map(m => ({
        userId: m.userId,
        role: m.role,
        userName: m.user.name,
        userEmail: m.user.email
      })),
      diagnosis
    });

  } catch (error) {
    console.error("[ENHANCED_DEBUG] Error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function diagnosePermissionIssue({
  userId,
  workspaceId,
  isDirectOwner,
  memberRecord,
  calculatedRole,
  permissions,
  workspace
}: any) {
  const issues = [];
  const solutions = [];

  // Issue 1: No role calculated
  if (!calculatedRole) {
    if (!isDirectOwner && !memberRecord) {
      issues.push("User is neither workspace owner nor a member");
      solutions.push({
        action: "add_member",
        description: "Add user to workspace members",
        sql: `INSERT INTO WorkspaceMember (userId, workspaceId, role) VALUES ('${userId}', '${workspaceId}', 'MEMBER')`
      });
    } else if (memberRecord && !calculatedRole) {
      issues.push(`Member record exists but role calculation failed. Role in DB: ${memberRecord.role}`);
      if (!['OWNER', 'ADMIN', 'MEMBER', 'GUEST'].includes(memberRecord.role)) {
        solutions.push({
          action: "fix_role",
          description: "Fix invalid role in database",
          sql: `UPDATE WorkspaceMember SET role = 'MEMBER' WHERE userId = '${userId}' AND workspaceId = '${workspaceId}'`
        });
      }
    }
  }

  // Issue 2: Owner without member record (potential issue)
  if (isDirectOwner && !memberRecord) {
    issues.push("Workspace owner doesn't have a member record (this might be intentional)");
    solutions.push({
      action: "optional_owner_member",
      description: "Optionally add owner as member for consistency",
      sql: `INSERT INTO WorkspaceMember (userId, workspaceId, role) VALUES ('${userId}', '${workspaceId}', 'OWNER')`
    });
  }

  // Issue 3: All permissions false
  const hasAnyPermission = Object.values(permissions).some(p => p === true);
  if (!hasAnyPermission) {
    issues.push("User has no permissions at all");
    solutions.push({
      action: "check_permission_logic",
      description: "Review permission calculation logic",
      details: `Role: ${calculatedRole}, Expected permissions for ${calculatedRole}: ${
        calculatedRole && ROLES[calculatedRole as keyof typeof ROLES] && Array.isArray(PERMISSIONS.VIEW_BOARD)
          ? PERMISSIONS.VIEW_BOARD.includes(ROLES[calculatedRole as keyof typeof ROLES])
          : 'N/A'
      }`
    });
  }

  // Issue 4: Workspace has no members
  if (workspace.members.length === 0) {
    issues.push("Workspace has no members at all");
    solutions.push({
      action: "seed_members",
      description: "Add workspace owner as initial member",
      sql: `INSERT INTO WorkspaceMember (userId, workspaceId, role) VALUES ('${workspace.userId}', '${workspaceId}', 'OWNER')`
    });
  }

  return {
    issues,
    solutions,
    status: issues.length === 0 ? "healthy" : "needs_attention",
    summary: issues.length === 0 
      ? "Permission system is working correctly"
      : `Found ${issues.length} issue(s) that need attention`
  };
}

// Helper endpoint to fix common issues
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, targetUserId, role = 'MEMBER' } = await req.json();
    const workspaceId = params.workspaceId;
    const userId = targetUserId || session.user.id;

    switch (action) {
      case 'add_member':
        const newMember = await prisma.workspaceMember.create({
          data: {
            userId,
            workspaceId,
            role: role as any
          }
        });
        return NextResponse.json({ success: true, data: newMember });

      case 'fix_role':
        const updatedMember = await prisma.workspaceMember.update({
          where: {
            userId_workspaceId: { userId, workspaceId }
          },
          data: { role: role as any }
        });
        return NextResponse.json({ success: true, data: updatedMember });

      case 'seed_workspace_owner':
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { userId: true }
        });
        
        if (workspace) {
          const ownerMember = await prisma.workspaceMember.upsert({
            where: {
              userId_workspaceId: {
                userId: workspace.userId,
                workspaceId
              }
            },
            create: {
              userId: workspace.userId,
              workspaceId,
              role: 'OWNER'
            },
            update: {
              role: 'OWNER'
            }
          });
          return NextResponse.json({ success: true, data: ownerMember });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[DEBUG_FIX] Error:", error);
    return NextResponse.json({ error: "Fix failed" }, { status: 500 });
  }
}