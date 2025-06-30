// Add this to your app/components/providers/SocketProvider.tsx
// This creates a global provider to manage the socket connection
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketClient } from '@/lib/socketClient';

// Define the context type
type SocketContextType = {
  isConnected: boolean;
  reconnect: () => void;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: (roomId: string) => void;
};

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  reconnect: () => {},
  joinRoom: async () => false,
  leaveRoom: () => {},
});

// Hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// The provider component
export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Initialize socket when the provider mounts
  useEffect(() => {
    // Initialize the socket connection by fetching the socket endpoint
    const initializeSocket = async () => {
      try {
        await fetch('/api/socketio');
        console.log('Socket.IO endpoint initialized');
      } catch (error) {
        console.error('Failed to initialize Socket.IO endpoint:', error);
      }
    };

    initializeSocket();

    // Set up connection state listeners
    const handleConnect = () => {
      console.log('Socket connected in provider');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected in provider');
      setIsConnected(false);
    };

    // Register listeners
    const unsubscribeConnect = socketClient.onEvent('connect', handleConnect);
    const unsubscribeDisconnect = socketClient.onEvent('disconnect', handleDisconnect);

    // Set initial connection state
    setIsConnected(socketClient.isConnected());

    // Check connection periodically
    const connectionCheck = setInterval(() => {
      const connected = socketClient.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 2000);

    // Cleanup
    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      clearInterval(connectionCheck);
    };
  }, []);

  // Provide methods to interact with the socket
  const reconnect = () => {
    socketClient.reconnect();
  };

  const joinRoom = async (roomId: string) => {
    return socketClient.joinRoom(roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketClient.leaveRoom(roomId);
  };

  return (
    <SocketContext.Provider value={{ isConnected, reconnect, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

// Usage in your main layout:
// 
// import { SocketProvider } from '@/components/providers/SocketProvider';
//
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body>
//         <SocketProvider>
//           {children}
//         </SocketProvider>
//       </body>
//     </html>
//   );
// }