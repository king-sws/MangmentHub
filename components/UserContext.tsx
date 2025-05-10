'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role?: string;
};

// Define the context type
type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserProfile: (updatedData: Partial<User>) => void;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);

  // Function to update user profile and broadcast the change
  const updateUserProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    
    // Update local state
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...updatedData };
    });
    
    // Broadcast event for other components to update
    const event = new CustomEvent('profile-updated');
    window.dispatchEvent(event);
  };

  // Effect to refresh user data when needed
  useEffect(() => {
    // Set initial user from props
    if (initialUser && !user) {
      setUser(initialUser);
    }
  }, [initialUser, user]);

  return (
    <UserContext.Provider value={{ user, setUser, updateUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
}