/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, memo } from "react";
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

// Helper functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

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

const getTimeSince = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 }
  ];

  for (const { unit, seconds: intervalSeconds } of intervals) {
    const interval = Math.floor(seconds / intervalSeconds);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  return "just now";
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "OWNER": 
      return <ShieldCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    case "ADMIN": 
      return <ShieldHalf className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    default: 
      return <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "OWNER": return "Owner";
    case "ADMIN": return "Admin";
    default: return "Member";
  }
};

interface MembersListProps {
  workspaceId: string;
}

export const MembersList = memo(({ workspaceId }: MembersListProps) => {
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
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
      toast.success(data.emailDelivered 
        ? "Invitation sent successfully" 
        : "Invitation created, but email delivery failed");
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
        throw new Error((await res.json()).error || "Failed to remove member");
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
        throw new Error((await res.json()).error || "Failed to cancel invitation");
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
        throw new Error((await res.json()).error || "Failed to leave workspace");
      }
      
      window.location.href = "/workspaces";
      toast.success("You have left the workspace");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave workspace");
    } finally {
      setLoading(false);
      setLeaveDialogOpen(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to update role");
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
      
      setTimeout(() => {
        setInvitationCopied(false);
        setCopiedInvitation(null);
      }, 2000);
    }).catch(() => {
      toast.error("Failed to copy invitation link");
    });
  };

  const canManageMembers = ["OWNER", "ADMIN"].includes(currentUserRole);
  const isOwner = currentUserRole === "OWNER";
  const currentUserId = session?.user?.id;

  if (loading && !refreshing) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        
        <Skeleton className="h-10 w-full rounded-lg" />
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Team Members
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {!isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLeaveDialogOpen(true)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {canManageMembers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-gray-100">
                    Invite a new member
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Send an invitation to join your workspace.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label 
                      htmlFor="email" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label 
                      htmlFor="role" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Role
                    </label>
                    <Select 
                      value={selectedRole} 
                      onValueChange={(value: "MEMBER" | "ADMIN") => setSelectedRole(value)}
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="MEMBER" className="text-gray-900 dark:text-gray-100">Member</SelectItem>
                        <SelectItem value="ADMIN" className="text-gray-900 dark:text-gray-100">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setInviteDialogOpen(false)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInvite} 
                    disabled={!email || loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-gray-100 dark:bg-gray-800">
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Members ({members.length})
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              Pending ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="mt-6 space-y-4">
          {members.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mb-4">
                <Shield className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                No members found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
                {isOwner ? "You're currently the only member of this workspace. Invite others to collaborate!" : "No other members are in this workspace yet."}
              </p>
              {canManageMembers && (
                <Button 
                  onClick={() => setInviteDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.user.image ? (
                        <AvatarImage src={member.user.image} alt={member.user.name || member.user.email} />
                      ) : (
                        <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                          {getInitials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2 flex-wrap text-gray-900 dark:text-gray-100">
                        {member.user.name || member.user.email}
                        {member.user.id === currentUserId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row text-sm text-gray-600 dark:text-gray-400 gap-2 sm:gap-4 mt-1">
                        {member.user.name && (
                          <span>{member.user.email}</span>
                        )}
                        <span>Joined {getTimeSince(member.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 ml-auto lg:ml-0 sm:mt-0">
                    {((isOwner && member.role !== "OWNER") || 
                      (currentUserRole === "ADMIN" && member.role === "MEMBER" && member.user.id !== currentUserId)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Member actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        >
                          <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">
                            Member Actions
                          </DropdownMenuLabel>
                          
                          {isOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(
                                  member.userId, 
                                  member.role === "ADMIN" ? "MEMBER" : "ADMIN"
                                )}
                                className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700"
                              >
                                {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                            </>
                          )}
                          
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/10"
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

                    {member.user.id === currentUserId && member.role !== "OWNER" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLeaveDialogOpen(true)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
        
        <TabsContent value="pending" className="mt-6 space-y-4">
          {invitations.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black border-gray-200 dark:border-black">
              <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mb-4">
                <Mail className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                No pending invitations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
                There are no pending invitations to join this workspace.
              </p>
              {canManageMembers && (
                <Button 
                  onClick={() => setInviteDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        {invitation.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2 flex-wrap text-gray-900 dark:text-gray-100">
                        {invitation.email}
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          {getRoleIcon(invitation.role)}
                          {getRoleLabel(invitation.role)}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row text-sm text-gray-600 dark:text-gray-400 gap-2 sm:gap-3 mt-1">
                        <span>Sent {getTimeSince(invitation.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {formatDate(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInvitationLink(invitation.id, invitation.token)}
                      disabled={invitationCopied && copiedInvitation === invitation.id}
                      className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {invitationCopied && copiedInvitation === invitation.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
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
                      className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Cancel invitation</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Remove member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to remove this member from the workspace? 
              They will lose access to all resources in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Leave workspace
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to leave this workspace? 
              You will lose access to all resources in this workspace unless you are invited back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveWorkspace}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Cancel invitation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel this invitation? 
              The invitation link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelInvitation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

MembersList.displayName = 'MembersList';