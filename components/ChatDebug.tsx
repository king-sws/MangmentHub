// 6. DEBUG COMPONENT - components/ChatDebug.tsx
import React, { useState, useEffect } from 'react';
import { socketClient } from '@/lib/socketClient';

export function ChatDebug({ roomId }: { roomId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    // Update debug info every second
    const interval = setInterval(() => {
      setDebugInfo(socketClient.getDebugInfo());
    }, 1000);
    
    // Setup debug listeners
    const unsubscribeNewMessage = socketClient.onEvent('newMessage', (message) => {
      setMessages(prev => [`New message: ${message.content}`, ...prev].slice(0, 10));
    });
    
    // Setup debug listeners
    const unsubscribeConnect = socketClient.onEvent('connect', () => {
      setMessages(prev => [`Socket connected at ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 10));
    });
    
    const unsubscribeDisconnect = socketClient.onEvent('disconnect', (reason) => {
      setMessages(prev => [`Socket disconnected: ${reason} at ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 10));
    });
    
    return () => {
      clearInterval(interval);
      unsubscribeNewMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);
  
  const handleReconnect = () => {
    socketClient.reconnect();
    setMessages(prev => [`Manual reconnect initiated at ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 10));
  };
  
  const handleJoinRoom = () => {
    socketClient.joinRoom(roomId);
    setMessages(prev => [`Joining room: ${roomId} at ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 10));
  };
  
  return (
    <div className="border border-gray-300 p-4 mb-4 rounded-lg">
      <h2 className="text-lg font-bold mb-2">Socket Debug</h2>
      <div className="mb-2">
        <span className={`px-2 py-1 rounded ${debugInfo.socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {debugInfo.socketConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="ml-2">Socket ID: {debugInfo.socketId || 'None'}</span>
      </div>
      <div className="mb-2">
        <button 
          onClick={handleReconnect}
          className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
        >
          Reconnect
        </button>
        <button 
          onClick={handleJoinRoom}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Join Room
        </button>
      </div>
      <div className="mb-2">
        <strong>Room ID:</strong> {roomId}
      </div>
      <div className="mb-2">
        <strong>Connected Rooms:</strong> {(debugInfo.connectedRooms || []).join(', ')}
      </div>
      <div>
        <strong>Event Log:</strong>
        <div className="bg-gray-100 p-2 rounded h-32 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}