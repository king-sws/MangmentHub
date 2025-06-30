// 4. SIMPLIFIED SOCKET API HANDLER - pages/api/socket/message.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { socketEmitters } from '@/lib/socketEmitters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { event, roomId, message } = req.body;
    
    if (!event || !roomId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    switch (event) {
      case 'newMessage':
        socketEmitters.newMessage(roomId, message);
        break;
      case 'messageUpdated':
        socketEmitters.messageUpdated(roomId, message);
        break;
      case 'messageDeleted':
        socketEmitters.messageDeleted(roomId, message);
        break;
      case 'memberAdded':
        socketEmitters.memberAdded(roomId, message);
        break;
      case 'memberRemoved':
        socketEmitters.memberRemoved(roomId, message.memberId);
        break;
      case 'memberUpdated':
        socketEmitters.memberUpdated(roomId, message);
        break;
      case 'typing':
        socketEmitters.typing(roomId, message.user);
        break;
      case 'stoppedTyping':
        socketEmitters.stoppedTyping(roomId, message.userId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Socket message error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
