// pages/api/workspaces/[workspaceId]/access-check.ts - Fixed Access Check
import { NextApiRequest, NextApiResponse } from 'next';

import { getUserWorkspaceRole } from '@/lib/permission';
import { auth } from '@/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  
  if (!workspaceId || Array.isArray(workspaceId)) {
    return res.status(400).json({ error: 'Invalid workspace ID' });
  }

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = await getUserWorkspaceRole(session.user.id, workspaceId);
    const hasAccess = userRole !== null;

    return res.status(200).json({
      workspaceId,
      hasAccess,
      role: userRole,
      timestamp: new Date().toISOString(),
      permissions: userRole ? {
        canView: true,
        canEdit: userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MEMBER',
        canManage: userRole === 'OWNER' || userRole === 'ADMIN',
        canDelete: userRole === 'OWNER'
      } : null
    });
  } catch (error) {
    console.error('Error checking workspace access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}