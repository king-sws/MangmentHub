/* eslint-disable @typescript-eslint/no-unused-vars */
// components/chat/ChatRoomMembers.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatRoomMember } from "@/types/chat";
import { Search, UserPlus, Crown, X, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";

interface ChatRoomMembersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  roomId: string;
  isCurrentUserAdmin?: boolean;
}

export default function ChatRoomMembers({
  isOpen,
  onOpenChange,
  workspaceId,
  roomId,
  isCurrentUserAdmin = false,
}: ChatRoomMembersProps) {
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"email" | "userId">("email");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<ChatRoomMember | null>(null);

  const session = useSession();

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomId, workspaceId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/members`
      );
      
      if (!res.ok) {
        throw new Error("Failed to load members");
      }
      
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
      setError("Failed to load members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!inviteEmail.trim()) {
      setError("Please enter an email address");
      return;
    }
    
    try {
      setIsInviting(true);
      
      const payload = inviteMethod === "email" 
        ? { email: inviteEmail } 
        : { userId: inviteEmail };
      
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to invite member");
      }
      
      // Refresh members list
      fetchMembers();
      setInviteEmail("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to invite member. Please try again.");
      }
      console.error("Error inviting member:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }
      
      // Update the local state
      setMembers(members.filter(member => member.id !== memberId));
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to remove member. Please try again.");
      }
    }
  };

  const handleToggleAdmin = async (member: ChatRoomMember) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/members/${member.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAdmin: !member.isAdmin,
          }),
        }
      );
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }
      
      const updatedMember = await res.json();
      
      // Update the local state
      setMembers(members.map(m => 
        m.id === member.id ? updatedMember : m
      ));
    } catch (error) {
      console.error("Error updating member:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update member. Please try again.");
      }
    }
  };

  const filteredMembers = searchQuery
    ? members.filter(member => 
        member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Room Members</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Invite form */}
          {isCurrentUserAdmin && (
            <form onSubmit={handleInviteMember} className="mb-6 space-y-2 border p-3 rounded-md bg-muted/30">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite New Member
              </h3>
              
              <div className="flex space-x-2">
                <Select
                  value={inviteMethod}
                  onValueChange={(value) => setInviteMethod(value as "email" | "userId")}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="userId">User ID</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder={inviteMethod === "email" ? "Enter email address" : "Enter user ID"}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type={inviteMethod === "email" ? "email" : "text"}
                  className="flex-1"
                />
                
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? "Inviting..." : "Add"}
                </Button>
              </div>
              
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </form>
          )}
          
          {/* Members list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Members ({members.length})</h3>
              <Badge variant="outline">
                {isCurrentUserAdmin ? "Admin" : "Member"}
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No members match your search" : "No members found"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.image || ""} alt={member.user?.name || "User"} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-sm">
                            {member.user?.name || "Unknown User"}
                          </p>
                          {member.isAdmin && (
                            <Badge variant="outline" className="ml-2 text-xs py-0">
                              <Crown className="h-3 w-3 text-yellow-500 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {isCurrentUserAdmin && member.user?.id !== session?.data?.user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAdmin(member)}
                          title={member.isAdmin ? "Remove admin" : "Make admin"}
                        >
                          <Shield className={`h-4 w-4 ${member.isAdmin ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRemove(member)}
                            title="Remove member"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.user?.name} from this chat room?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <Button 
                              variant="destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}