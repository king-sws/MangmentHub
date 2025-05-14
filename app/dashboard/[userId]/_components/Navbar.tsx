'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';

// Define notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkTo: string | null;
  createdAt: string;
  relatedId: string | null;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Navbar({ user }: { user: any }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/notifications?limit=5');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      await axios.patch(`/api/notifications/${notificationId}`, { isRead: true });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Load notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Set up periodic fetching of unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/notifications?limit=1&unreadOnly=true');
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up interval to check for new notifications
    const intervalId = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // If there's no link, we'll close the dropdown
    if (!notification.linkTo) {
      setShowNotifications(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background border-b border-border shadow-sm h-16 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Menu className="h-5 w-5 text-muted-foreground lg:hidden" />
        <Link href="/dashboard">
          <div className="flex items-center">
            <Image src="/logo-no-background.png" alt="Logo" width={132} height={132} className="h-6 w-6" />
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notification Button with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-background rounded-md shadow-lg py-1 z-50 border border-border">
              <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 border-b border-border last:border-0 ${notification.isRead ? 'bg-background' : 'bg-blue-50 dark:bg-blue-900/20'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {notification.linkTo ? (
                            <Link 
                              href={notification.linkTo} 
                              onClick={() => handleNotificationClick(notification)}
                              className="block"
                            >
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-sm">{notification.message}</p>
                            </Link>
                          ) : (
                            <>
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-sm">{notification.message}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex space-x-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => markAsRead(notification.id, e)}
                            >
                              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="px-4 py-2 border-t border-border">
                <Link 
                  href={`/dashboard/${user.id}/notifications`}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="lg" className="gap-2 outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user.name?.split(' ')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/profile`}>
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/settings`}>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}