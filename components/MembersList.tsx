/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MembersList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Loader2, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldHalf, 
  Mail, 
  UserPlus,
  MoreHorizontal,
  Clock,
  RefreshCw,
  LogOut,
  Copy,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";

// Types
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  user: User;
}

interface Invitation {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  expiresAt: string;
  token: string;
}

// Helper to format dates
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

// Helper to get initials from name or email
const getInitials = (name: string | null, email: string): string => {
  if (name) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.substring(0, 2).toUpperCase();
};

// Helper to get time since a date
const getTimeSince = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? "1 year ago" : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? "1 month ago" : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? "1 day ago" : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  }
  
  return "just now";
};

export function MembersList({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("MEMBER");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [copiedInvitation, setCopiedInvitation] = useState<string | null>(null);
  const [invitationCopied, setInvitationCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch members");
      }
      
      const data = await res.json();
      
      // Make sure we're handling the data correctly
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
      setCurrentUserRole(data.currentUserRole || "MEMBER");
    } catch (error) {
      toast.error("Error loading members");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!email) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: selectedRole }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      await fetchMembers();
      setEmail("");
      setInviteDialogOpen(false);
      
      if (data.member) {
        toast.success("Member added successfully");
      } else {
        toast.success(data.emailDelivered 
          ? "Invitation sent successfully" 
          : "Invitation created, but email delivery failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberToRemove }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove member");
      }
      
      await fetchMembers();
      toast.success("Member removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setLoading(false);
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invitationToCancel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }
      
      await fetchMembers();
      toast.success("Invitation canceled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invitation");
    } finally {
      setLoading(false);
      setCancelDialogOpen(false);
      setInvitationToCancel(null);
    }
  };

  const handleLeaveWorkspace = async () => {
    try {
      setLoading(true);
      // Find the current user's member ID
      const currentUser = members.find(m => m.user.id === session?.user?.id);
      if (!currentUser) {
        throw new Error("Your membership not found");
      }
      
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: currentUser.userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to leave workspace");
      }
      
      // Redirect to workspaces list
      window.location.href = "/workspaces";
      toast.success("You have left the workspace");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave workspace");
      setLoading(false);
      setLeaveDialogOpen(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      setLoading(true);
      // Use the direct member route for updating member roles
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }
      
      await fetchMembers();
      toast.success("Role updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvitationLink = (invitationId: string, token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInvitation(invitationId);
      setInvitationCopied(true);
      toast.success("Invitation link copied to clipboard");
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setInvitationCopied(false);
        setCopiedInvitation(null);
      }, 2000);
    });
  };

  const canManageMembers = ["OWNER", "ADMIN"].includes(currentUserRole);
  const isOwner = currentUserRole === "OWNER";
  const currentUserId = session?.user?.id;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER": 
        return <ShieldCheck className="h-4 w-4 text-purple-600" />;
      case "ADMIN": 
        return <ShieldHalf className="h-4 w-4 text-blue-600" />;
      default: 
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER": return "Owner";
      case "ADMIN": return "Admin";
      default: return "Member";
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <Skeleton className="h-10 w-full" />
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Workspace
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchMembers()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {canManageMembers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a new member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your workspace.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Select 
                      value={selectedRole} 
                      onValueChange={(value: "MEMBER" | "ADMIN") => setSelectedRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={!email || loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="pending">
              Pending Invitations ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="space-y-4 mt-4">
          {members.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {isOwner ? "You're currently the only member of this workspace. Invite others to collaborate!" : "No other members are in this workspace yet."}
              </p>
              {canManageMembers && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite People
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {member.user.image ? (
                        <AvatarImage src={member.user.image} alt={member.user.name || member.user.email} />
                      ) : (
                        <AvatarFallback>
                          {getInitials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {member.user.name || member.user.email}
                        {member.user.id === currentUserId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <div className="flex text-sm text-muted-foreground gap-4">
                        {member.user.name && (
                          <span>{member.user.email}</span>
                        )}
                        <span>Joined {getTimeSince(member.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Show options if user has proper permissions */}
                    {((isOwner && member.role !== "OWNER") || 
                      (currentUserRole === "ADMIN" && member.role === "MEMBER" && member.user.id !== currentUserId)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                          
                          {isOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(
                                  member.userId, 
                                  member.role === "ADMIN" ? "MEMBER" : "ADMIN"
                                )}
                              >
                                {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setMemberToRemove(member.userId);
                              setRemoveDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Self-leave option */}
                    {member.user.id === currentUserId && member.role !== "OWNER" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLeaveDialogOpen(true)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          {invitations.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                There are no pending invitations to join this workspace.
              </p>
              {canManageMembers && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite People
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {invitation.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {invitation.email}
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          {getRoleIcon(invitation.role)}
                          {getRoleLabel(invitation.role)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>Sent {getTimeSince(invitation.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {formatDate(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInvitationLink(invitation.id, invitation.token)}
                      disabled={invitationCopied && copiedInvitation === invitation.id}
                    >
                      {invitationCopied && copiedInvitation === invitation.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInvitationToCancel(invitation.id);
                        setCancelDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Remove member confirmation dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the workspace? 
              They will lose access to all resources in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave workspace confirmation dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this workspace? 
              You will lose access to all resources in this workspace unless you are invited back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveWorkspace}
              className="bg-destructive hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel invitation confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? 
              The invitation link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelInvitation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancel invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}