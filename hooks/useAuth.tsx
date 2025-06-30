/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuth.tsx
'use client';

import { useContext, createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Define types for user and auth context
interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string;
  emailVerified?: Date | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  socket: typeof Socket | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, inviteToken?: string) => Promise<{
    success: boolean;
    error?: string | null;
    workspaceId?: string | null;
  }>;
  signup: (name: string, email: string, password: string, inviteToken?: string) => Promise<{
    success: boolean;
    error?: string | null;
    workspaceId?: string | null;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  socket: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

// Create provider component with initialUser prop
export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode;
  initialUser?: User | null;
}) {
  const { data: session, status, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(initialUser || null);
  const router = useRouter();

  // Convert session data to our User type, prioritizing initialUser if available
  const user: User | null = useMemo(() => {
    if (initialUser) {
      return initialUser;
    }
    
    if (session?.user) {
      return {
        id: session.user.id || '',
        name: session.user.name || null,
        email: session.user.email || '',
        image: session.user.image || null,
        role: (session.user as any).role || undefined,
        emailVerified: (session.user as any).emailVerified || null,
      };
    }
    
    return localUser;
  }, [session?.user, initialUser, localUser]);

  const loading = status === "loading" && !initialUser;
  const isAuthenticated = !!user;

  // Initialize socket with authentication
  const initializeSocket = useCallback((userId: string) => {
    try {
      // Close existing socket if any
      if (socket) {
        socket.disconnect();
      }

      // Create new socket connection with auth data
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        auth: {
          userId,
        },
        autoConnect: true,
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected with ID:', newSocket.id);
      });

      newSocket.on('error', (err: any) => {
        console.error('Socket error:', err);
        toast.error('Connection error: Please refresh the page');
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, try to reconnect
          newSocket.connect();
        }
      });

      setSocket(newSocket);
      return newSocket;
    } catch (error) {
      console.error('Socket initialization error:', error);
      return null;
    }
  }, [socket]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  // Handle socket connection based on authentication state
  useEffect(() => {
    if (user?.id && !loading) {
      // Initialize socket connection if user is authenticated
      if (!socket) {
        initializeSocket(user.id);
      }
    } else {
      // Disconnect socket if user is not authenticated
      disconnectSocket();
    }

    // Cleanup function
    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [user?.id, loading, socket, initializeSocket, disconnectSocket]);

  // Store user data in localStorage for socket operations
  useEffect(() => {
    if (user) {
      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email
      }));
    } else {
      localStorage.removeItem('userData');
    }
  }, [user]);

  // Login method - using Auth.js signIn
  const login = async (email: string, password: string, inviteToken?: string) => {
    try {
      setError(null);
      
      // Use Auth.js signIn with credentials
      const result = await signIn('credentials', {
        email,
        password,
        inviteToken,
        redirect: false, // Don't redirect automatically
      });

      if (result?.error) {
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Invalid credentials' 
          : result.error;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (result?.ok) {
        // Determine redirect path based on your logic
        let redirectPath = '/dashboard';
        
        router.push(redirectPath);
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Signup method
  const signup = async (name: string, email: string, password: string, inviteToken?: string) => {
    try {
      setError(null);
      
      // Call your signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return { success: false, error: data.error || 'Registration failed' };
      }

      // After successful signup, sign in the user
      const loginResult = await login(email, password, inviteToken);
      return loginResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout method - using Auth.js signOut
  const logout = async () => {
    try {
      disconnectSocket();
      localStorage.removeItem('userData');
      setLocalUser(null);
      await signOut({ redirect: false });
      setError(null);
      router.push('/login'); // Redirect to login page
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Refresh user method - using Auth.js update
  const refreshUser = async () => {
    try {
      await update(); // This will refetch the session
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    socket,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}