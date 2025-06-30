/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/socketEmitters.ts - Enhanced version with read receipts and typing
export const socketEmitters = {
  // ========== MESSAGE EMITTERS ==========
  newMessage: (roomId: string, message: any) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit newMessage');
      return;
    }
    console.log(`Emitting newMessage to room ${roomId}`);
    // Include read tracking initialization
    io.to(roomId).emit('newMessage', {
      ...message,
      readBy: [], // Initialize empty read receipts
      deliveredTo: [] // Initialize empty delivery receipts
    });
  },
     
  messageUpdated: (roomId: string, message: any) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messageUpdated');
      return;
    }
    io.to(roomId).emit('messageUpdated', message);
  },
     
  messageDeleted: (roomId: string, messageDetails: any) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messageDeleted');
      return;
    }
    io.to(roomId).emit('messageDeleted', messageDetails);
  },

  // ========== READ RECEIPT EMITTERS ==========
  messageRead: (roomId: string, messageId: string, readBy: { userId: string; userName: string; readAt: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messageRead');
      return;
    }
    console.log(`Emitting messageRead for message ${messageId} in room ${roomId}`);
    io.to(roomId).emit('messageRead', {
      messageId,
      readBy,
      totalReads: 1 // This would be calculated from actual receipts
    });
  },

  messagesRead: (roomId: string, messageIds: string[], readBy: { userId: string; userName: string; readAt: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit messagesRead');
      return;
    }
    console.log(`Emitting messagesRead for ${messageIds.length} messages in room ${roomId}`);
    io.to(roomId).emit('messagesRead', {
      messageIds,
      readBy
    });
  },

  // ========== TYPING INDICATORS ==========
  typing: (roomId: string, user: { id: string; name: string }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit typing');
      return;
    }
    console.log(`Emitting typing for user ${user.name} in room ${roomId}`);
    io.to(roomId).emit('typing', {
      userId: user.id,
      userName: user.name,
      startedAt: new Date()
    });
  },
     
  stoppedTyping: (roomId: string, userId: string) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit stoppedTyping');
      return;
    }
    console.log(`Emitting stoppedTyping for user ${userId} in room ${roomId}`);
    io.to(roomId).emit('stoppedTyping', { userId });
  },

  // ========== USER PRESENCE EMITTERS ==========
  userOnline: (roomId: string, user: { userId: string; userName: string; lastSeen: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit userOnline');
      return;
    }
    io.to(roomId).emit('userOnline', user);
  },

  userOffline: (roomId: string, user: { userId: string; lastSeen: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit userOffline');
      return;
    }
    io.to(roomId).emit('userOffline', user);
  },

  userJoined: (roomId: string, user: { userId: string; userName: string; lastSeen: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit userJoined');
      return;
    }
    io.to(roomId).emit('userJoined', user);
  },

  userLeft: (roomId: string, userId: string) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit userLeft');
      return;
    }
    io.to(roomId).emit('userLeft', { userId });
  },

  userPresenceUpdated: (roomId: string, user: { userId: string; userName: string; status: string; lastSeen: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit userPresenceUpdated');
      return;
    }
    io.to(roomId).emit('userPresenceUpdated', user);
  },

  // ========== MEMBER MANAGEMENT EMITTERS ==========
  memberAdded: (roomId: string, member: any) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit memberAdded');
      return;
    }
    io.to(roomId).emit('memberAdded', member);
  },
     
  memberRemoved: (roomId: string, memberId: string) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit memberRemoved');
      return;
    }
    io.to(roomId).emit('memberRemoved', { memberId });
  },
     
  memberUpdated: (roomId: string, member: any) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit memberUpdated');
      return;
    }
    io.to(roomId).emit('memberUpdated', member);
  },

  // ========== UTILITY FUNCTIONS ==========
  // Get room statistics
  getRoomStats: (roomId: string) => {
    // This would integrate with your enhanced socket server's getRoomState function
    console.log(`Getting stats for room ${roomId}`);
    // Return mock data - integrate with actual room state from enhancedSocketServer
    return {
      onlineUsers: [],
      typingUsers: [],
      totalReadReceipts: 0
    };
  },

  // Broadcast read receipt update (for server-side read marking)
  broadcastReadReceipt: (roomId: string, messageId: string, readBy: { userId: string; userName: string; readAt: Date }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot broadcast read receipt');
      return;
    }
    
    console.log(`Broadcasting read receipt for message ${messageId} in room ${roomId}`);
    io.to(roomId).emit('messageRead', {
      messageId,
      readBy,
      totalReads: 1 // This should be calculated from actual room state
    });
  },

  // Send read receipts data to a specific socket
  sendReadReceipts: (socketId: string, roomId: string, receipts: Record<string, any[]>) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot send read receipts');
      return;
    }
    
    io.to(socketId).emit('readReceipts', {
      roomId,
      receipts
    });
  },

  // Send room state to joining user
  sendRoomState: (socketId: string, roomId: string, roomState: { onlineUsers: any[]; typingUsers: any[] }) => {
    const io = (global as any).socketIo;
    if (!io) {
      console.warn('Socket.IO not initialized, cannot send room state');
      return;
    }
    
    io.to(socketId).emit('joinedRoom', {
      roomId,
      ...roomState
    });
  }
};