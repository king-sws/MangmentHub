/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Search, Command, Plus, X, CheckSquare, Layout, Home, User2, CreditCard, ChevronRight, Shield, RotateCcw, User, MessageSquare, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import axios from 'axios';
import { 
  User as UserIcon, 
  Palette, 
  Settings, 
  BellOff, 
  Keyboard, 
  Gift, 
  Download, 
  HelpCircle, 
  Trash, 
  ExternalLink,
  Sparkles,
  Zap,
  Moon,
  Sun
} from 'lucide-react'
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import { toast } from 'sonner';

// Define user interface
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

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
export default function Navbar({ user, onToggleSidebar }: { user: User, onToggleSidebar: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  // Track window width for responsive design
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    const router = useRouter(); // Add this

  // Add this logout handler function
  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/sign-in",
      });
      router.refresh();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch) {
      if (isMobile && mobileSearchRef.current) {
        mobileSearchRef.current.focus();
      } else if (!isMobile && searchRef.current) {
        searchRef.current.focus();
      }
    }
  }, [showSearch, isMobile]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search logic here
      console.log('Searching for:', searchQuery);
      // You can add navigation to search results page or filter logic
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  // Determine notification panel position and styles based on screen size
  const getNotificationPanelStyles = (): React.CSSProperties => {
    // Mobile and small screens
    if (isMobile) {
      return {
        position: 'fixed',
        top: '4rem', // Below navbar
        left: '0.5rem',
        right: '0.5rem',
        width: 'auto',
        maxHeight: 'calc(100vh - 5rem)', // Full height minus navbar and padding
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 50,
      };
    }
    
    // Tablet and desktop (default dropdown positioning)
    return {
      position: 'absolute',
      right: 0,
      width: 380,
      maxHeight: '80vh',
      borderRadius: 12,
    };
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm shadow-slate-100/50 dark:shadow-slate-900/50 h-16">
        <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6">
          {/* Add this mobile menu button */}
          <div className="lg:hidden mr-2">
            <Button 
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9 p-0 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors rounded-lg"
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
          </div>
          {/* Center section - Search (Desktop) */}
          <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block">
            {showSearch ? (
              <form onSubmit={handleSearchSubmit} className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces, tasks, projects..."
                  className="w-full h-10 pl-12 pr-12 bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50 dark:focus:border-indigo-500/50 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full h-10 px-4 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/40 rounded-xl text-left text-slate-500 dark:text-slate-400 transition-all duration-300 flex items-center gap-3 group backdrop-blur-sm"
              >
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
                <span className="flex-1 text-sm truncate">Search anything...</span>
                <div className="hidden lg:flex items-center gap-1 text-xs bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200/40 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 group-hover:border-slate-300/60 dark:group-hover:border-slate-600/60 transition-colors flex-shrink-0">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </button>
            )}
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Mobile search button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSearch(true)}
              className="md:hidden h-9 w-9 p-0 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors rounded-lg flex-shrink-0"
            >
              <Search className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>

            {/* Quick Action Button - Hidden on very small screens */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 p-0 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg transition-all duration-200 group relative overflow-hidden flex-shrink-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                    <Plus className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:rotate-90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300 relative z-10" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  className="w-64 sm:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-2 animate-in slide-in-from-top-4 duration-200"
                >
                  {/* Header */}
                  <div className="px-3 py-3 border-b border-slate-100/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                    </div>
                  </div>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      href={`/workspace/new`} 
                      className="w-full px-3 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 flex items-center space-x-3 rounded-xl group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                        <Home className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">New Workspace</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Create a collaborative space</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/board/new" 
                      className="w-full px-3 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 flex items-center space-x-3 rounded-xl group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                        <Layout className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">New Board</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Organize with Kanban boards</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/tasks/new" 
                      className="w-full px-3 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 flex items-center space-x-3 rounded-xl group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">New Task</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Add a quick task</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Theme Toggle */}
            <div className="h-9 w-9 flex items-center justify-center flex-shrink-0">
              <ThemeToggle />
            </div>
            
            {/* Notification Button with Dropdown */}
            <div className="relative flex-shrink-0" ref={notificationRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-9 w-9 p-0 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 group rounded-lg"
              >
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-lg shadow-rose-500/25 animate-pulse ring-2 ring-white dark:ring-slate-950 text-[10px] font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div 
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-slate-200/20 dark:shadow-slate-900/40 rounded-2xl py-2 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-200"
                  style={getNotificationPanelStyles()}
                >
                  <div className="px-4 sm:px-6 py-4 border-b border-slate-100/60 dark:border-slate-800/60 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bell className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">Notifications</h3>
                    </div>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20 transition-colors rounded-lg px-2 sm:px-3 py-1.5 flex-shrink-0"
                      >
                        <span className="hidden sm:inline">Mark all read</span>
                        <span className="sm:hidden">Mark all</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: isMobile ? 'calc(100d vh - 12rem)' : '65vh' }}>
                    {loading ? (
                      <div className="px-4 sm:px-6 py-8 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 mr-3"></div>
                        Loading notifications...
                      </div>
                    ) : error ? (
                      <div className="px-4 py-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 mx-4 rounded-xl border border-rose-200/50 dark:border-rose-800/50">
                        {error}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 sm:px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">All caught up!</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <div 
                          key={notification.id}
                          className={`px-4 sm:px-6 py-4 border-b border-slate-100/40 dark:border-slate-800/40 last:border-0 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group cursor-pointer ${
                            notification.isRead 
                              ? 'bg-white dark:bg-slate-900' 
                              : 'bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-pink-950/20 border-l-4 border-l-indigo-400 dark:border-l-indigo-500'
                          }`}
                          style={{
                            animationDelay: `${index * 50}ms`,
                          }}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {notification.linkTo ? (
                                <Link 
                                  href={notification.linkTo} 
                                  onClick={() => handleNotificationClick(notification)}
                                  className="block group/link"
                                >
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors mb-1 line-clamp-1">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                </Link>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{notification.title}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{notification.message}</p>
                                </>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-indigo-500'}`}></div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                                  onClick={(e) => markAsRead(notification.id, e)}
                                >
                                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-rose-100/80 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                                onClick={(e) => deleteNotification(notification.id, e)}
                              >
                                <Trash2 className="h-3 w-3 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" />
                              </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100/60 dark:border-slate-800/60 sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                  <div className="flex justify-between items-center">
                    <Link 
                      href={`/dashboard/${user.id}/notifications`}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors flex items-center gap-1 group"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all notifications 
                      <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                    
                    {isMobile && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown Menu */}
  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
    <DropdownMenuTrigger asChild>
    <Button 
      variant="ghost" 
      size="lg" 
      className="flex items-center space-x-3 p-3 hover:bg-accent transition-all duration-200 group outline-none focus:outline-none border-none bg-transparent rounded-lg"
    >
  <div className="relative">
    <Avatar className="h-10 w-10 ring-2 ring-green-500/20">
      <AvatarImage src={user.image} alt={user.name} />
      <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm">        {user.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
  </div>
  <div className="hidden md:block text-left">
    <p className="text-sm font-semibold text-foreground truncate max-w-32 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
      {user.name}
    </p>
  </div>
</Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent 
    align="end" 
    className="w-72 bg-card backdrop-blur-xl hide-scrollbar rounded-lg shadow-2xl border border-border p-2 animate-in slide-in-from-top-2 duration-200"
  >
    {/* User Info Header */}
    <div className="px-3 py-4 border-b border-border mb-2">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10 ring-1 ring-border">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user.name}
          </p>
          <p className="text-xs text-green-400 truncate">
            Online
          </p>
        </div>
      </div>
    </div>

    

    {/* Main Navigation Items */}
    <div className="space-y-1">
      

      <DropdownMenuItem asChild>
        <Link 
          href={`/dashboard/${user.id}/profile`} 
          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Profile</span>
        </Link>
      </DropdownMenuItem>

      

      <DropdownMenuItem asChild>
        <Link 
          href={`/dashboard/${user.id}/settings`} 
          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Settings</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
          <Link 
          href={`/dashboard/${user.id}/notifications`} 
          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Notification settings</span>
          </Link>
      </DropdownMenuItem>
    </div>

    <DropdownMenuSeparator className="my-2 h-px bg-border" />

    {/* Secondary Items */}
    <div className="space-y-1">
      <div
  onClick={() => {
    setIsDropdownOpen(false); // Close dropdown first
    setShowKeyboardShortcuts(true); // Then open dialog
  }}
  className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
>
  <Keyboard className="h-4 w-4 text-muted-foreground" />
  <span className="text-sm text-muted-foreground">Keyboard shortcuts</span>
</div>

      
      <DropdownMenuItem asChild onSelect={() => {
        toast("Help section is coming soon! We're working hard to bring you comprehensive help resources.");
      }}>
        <Link 
          href="/help" 
          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Help</span>
          <div className="w-3 h-3 ml-auto">
            <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </Link>
      </DropdownMenuItem>
    </div>

    <DropdownMenuSeparator className="my-2 h-px bg-border" />

    {/* Bottom Items */}
    <div className="space-y-1">
      <DropdownMenuItem asChild>
        <Link 
          href="/dashboard/feedback" 
          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-all duration-150 flex items-center space-x-3 rounded-md group cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Feedback</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem 
          className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-300 w-full px-3 py-2.5 text-left transition-all duration-150 flex items-center space-x-3 rounded-md"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Log out</span>
        </DropdownMenuItem>
    </div>
  </DropdownMenuContent>
</DropdownMenu>
        </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showSearch && isMobile && (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div className="p-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces, tasks, projects..."
                className="w-full h-14 pl-12 pr-12 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50 dark:focus:border-blue-500/50 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl"
              >
                <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </Button>
            </form>
            
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Searches</h3>
              <div className="space-y-2">
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                  Project Alpha
                </div>
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                  Team Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <KeyboardShortcutsDialog 
      isOpen={showKeyboardShortcuts}
      onClose={() => setShowKeyboardShortcuts(false)}
    />
    </>
  );
}