// types/chat.ts
export interface ChatRoom {
  [x: string]: any;
  avatar: string | Blob | undefined;
  unreadCount: number;
  id: string;
  name: string | null;
  description: string | null;
  workspaceId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    messages: number;
  };
  lastMessage?: ChatMessage | null;
}

export interface ChatRoomMember {
  id: string;
  chatRoomId: string;
  userId: string;
  isAdmin: boolean;
  joinedAt: string;
  role: 'ADMIN' | 'MEMBER';
  lastReadAt: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isSystemMessage: boolean;
  replyToId: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string | null;
    };
  } | null;
  reactions?: ChatReaction[];
  attachments?: ChatAttachment[];
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export interface ChatReaction {
  [x: string]: ReactNode;
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
  };
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  thumbnailUrl?: string;
}

export interface FileStorageItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: Buffer;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface SocketMessagePayload {
  event: 'newMessage' | 'messageDeleted' | 'messageUpdated' | 'messageReaction' | 'typing';
  roomId: string;
  message?: ChatMessage;
  messageId?: string;
  userId?: string;
  isTyping?: boolean;
  reaction?: ChatReaction;
}