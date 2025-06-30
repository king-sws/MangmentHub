/* eslint-disable @typescript-eslint/no-unused-vars */
// components/chat/ChatHeader.tsx - Professional Enterprise Version
'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChatRoom, ChatRoomMember } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Users, 
  Settings, 
  Lock, 
  Unlock,
  Info,
  Search,
  Pin,
  Archive,
  Bell,
  BellOff,
  Copy,
  ExternalLink,
  UserPlus,
  Shield,
  Clock,
  Hash,
  Globe,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import ChatRoomMembers from "./ChatRoomMembers";
import ChatRoomSettings from "./ChatRoomSettings";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

interface ChatHeaderProps {
  room: ChatRoom | null;
  workspaceId: string;
  unreadCount?: number;
  typingUsers?: TypingUser[];
  isConnected?: boolean;
  onSearch?: () => void;
  onTogglePin?: () => void;
  onArchive?: () => void;
  onInviteMembers?: () => void;
  className?: string;
}

interface RoomStats {
  memberCount: number;
  lastActivity: Date;
  messageCount: number;
}

export default function ChatHeader({ 
  room, 
  workspaceId, 
  unreadCount = 0,
  typingUsers = [],
  isConnected = true,
  onSearch,
  onTogglePin,
  onArchive,
  onInviteMembers,
  className
}: ChatHeaderProps) {
  // State management
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  
  const { data: session } = useSession();

  // Memoized values for performance
  const roomIcon = useMemo(() => {
    if (!room) return null;
    return room.isPrivate ? (
      <Lock className="h-4 w-4 text-amber-600" />
    ) : (
      <Hash className="h-4 w-4 text-blue-600" />
    );
  }, [room?.isPrivate]);

  const connectionStatus = useMemo(() => ({
    icon: isConnected ? Wifi : WifiOff,
    className: isConnected ? "text-green-600" : "text-red-500",
    tooltip: isConnected ? "Connected" : "Disconnected"
  }), [isConnected]);

  const typingText = useMemo(() => {
    if (!typingUsers.length) return null;
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  }, [typingUsers]);

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    if (!room || !session?.user?.id) return;
    
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${room.id}/members`,
        { 
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const members = await res.json();
      const isAdmin = members.some(
        (member: ChatRoomMember) => 
          member.userId === session.user.id && member.isAdmin
      );
      
      setIsCurrentUserAdmin(isAdmin);
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Fallback to non-admin state on error
      setIsCurrentUserAdmin(false);
    }
  }, [room?.id, session?.user?.id, workspaceId]);

  // Fetch room statistics
  const fetchRoomStats = useCallback(async () => {
    if (!room) return;
    
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${room.id}/stats`
      );
      
      if (res.ok) {
        const stats = await res.json();
        setRoomStats(stats);
      }
    } catch (error) {
      console.error("Error fetching room stats:", error);
    }
  }, [room?.id, workspaceId]);

  // Effects
  useEffect(() => {
    checkAdminStatus();
    fetchRoomStats();
  }, [checkAdminStatus, fetchRoomStats]);

  // Event handlers
  const handleCopyRoomLink = useCallback(async () => {
    if (!room) return;
    
    const roomUrl = `${window.location.origin}/workspace/${workspaceId}/chat/${room.id}`;
    
    try {
      await navigator.clipboard.writeText(roomUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy room link:", error);
    }
  }, [room?.id, workspaceId]);

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationEnabled(prev => !prev);
    // Implement notification toggle logic here
  }, []);

  if (!room) {
    return (
      <div className={cn(
        "border-b border-border p-4 flex justify-center items-center bg-background",
        "animate-pulse",
        className
      )}>
        <div className="h-6 bg-muted rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "sticky top-0 z-20 shadow-sm",
      className
    )}>
      {/* Main header content */}
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Left section - Room info */}
        <div className="flex items-center min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {roomIcon}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg text-foreground truncate">
                  {room.name || "Unnamed Room"}
                </h1>
                
                {room.isPrivate && (
                  <Badge variant="secondary" className="text-xs">
                    Private
                  </Badge>
                )}
                
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1.5"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              
              {/* Typing indicator or room description */}
              <div className="text-sm text-muted-foreground mt-0.5 truncate">
                {typingText || (
                  <span className="flex items-center gap-1">
                    {roomStats?.memberCount && (
                      <span>{roomStats.memberCount} member{roomStats.memberCount > 1 ? 's' : ''}</span>
                    )}
                    {roomStats?.memberCount && roomStats?.lastActivity && <span>•</span>}
                    {roomStats?.lastActivity && (
                      <span>Active {new Date(roomStats.lastActivity).toLocaleDateString()}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 ml-4">
          {/* Connection status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1">
                  <connectionStatus.icon 
                    className={cn("h-3 w-3", connectionStatus.className)} 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{connectionStatus.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Search */}
          {onSearch && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onSearch}
                    className="h-8 w-8 p-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search messages</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Members */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsMembersOpen(true)}
                  className="h-8 w-8 p-0 relative"
                >
                  <Users className="h-4 w-4" />
                  {roomStats?.memberCount && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-4 min-w-[1rem] text-xs px-1"
                    >
                      {roomStats.memberCount > 99 ? '99+' : roomStats.memberCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View members</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Info */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsInfoOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Room details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{room.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {room.isPrivate ? 'Private room' : 'Public room'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Notifications */}
              <DropdownMenuItem onClick={handleToggleNotifications}>
                {isNotificationEnabled ? (
                  <BellOff className="mr-2 h-4 w-4" />
                ) : (
                  <Bell className="mr-2 h-4 w-4" />
                )}
                {isNotificationEnabled ? 'Mute notifications' : 'Enable notifications'}
              </DropdownMenuItem>

              {/* Pin/Unpin */}
              {onTogglePin && (
                <DropdownMenuItem onClick={onTogglePin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {room.isPinned ? 'Unpin room' : 'Pin room'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Copy link */}
              <DropdownMenuItem onClick={handleCopyRoomLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy room link
              </DropdownMenuItem>

              {/* Invite members */}
              {(isCurrentUserAdmin || !room.isPrivate) && onInviteMembers && (
                <DropdownMenuItem onClick={onInviteMembers}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite members
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Admin actions */}
              {isCurrentUserAdmin && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin actions
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Room settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsMembersOpen(true)}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage members
                    </DropdownMenuItem>
                    {onArchive && (
                      <DropdownMenuItem onClick={onArchive} className="text-destructive">
                        <Archive className="mr-2 h-4 w-4" />
                        Archive room
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Regular settings for non-admins */}
              {!isCurrentUserAdmin && (
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Room settings
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Room Info Drawer */}
      <Drawer open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded-lg">
                {roomIcon}
              </div>
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-xl">{room.name}</DrawerTitle>
                <DrawerDescription className="flex items-center gap-2 mt-1">
                  <Badge variant={room.isPrivate ? "secondary" : "outline"} className="text-xs">
                    {room.isPrivate ? "Private" : "Public"}
                  </Badge>
                  <span>•</span>
                  <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {room.description || "No description provided for this room."}
              </p>
            </div>

            {/* Statistics */}
            {roomStats && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{roomStats.memberCount}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{roomStats.messageCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                </div>
              </div>
            )}

            {/* Unread messages info */}
            {unreadCount > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </h3>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    You have <strong>{unreadCount}</strong> unread message{unreadCount > 1 ? 's' : ''} in this room.
                  </p>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyRoomLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsInfoOpen(false);
                    setIsMembersOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Users className="h-3 w-3" />
                  View Members
                </Button>
                {isCurrentUserAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsInfoOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-3 w-3" />
                    Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DrawerFooter className="pt-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Members Management Drawer */}
      <ChatRoomMembers 
        isOpen={isMembersOpen}
        onOpenChange={setIsMembersOpen}
        workspaceId={workspaceId}
        roomId={room.id}
        isCurrentUserAdmin={isCurrentUserAdmin}
      />

      {/* Room Settings Drawer */}
      <ChatRoomSettings
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        workspaceId={workspaceId}
        roomId={room.id}
        initialData={room}
      />
    </div>
  );
}