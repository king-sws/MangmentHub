'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Check, Trash2, Bell, BellOff, X, CheckCircle, Calendar, Users, FileText, Star, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    unreadCount
  } = useNotifications(50, true, filter === 'unread');

  // Get notification type icon based on type
  const getNotificationTypeIcon = (type: string) => {
    switch(type) {
      case 'TASK_ASSIGNED':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'TASK_DUE_SOON':
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'INVITATION':
        return <Mail className="h-5 w-5 text-purple-500" />;
      case 'WORKSPACE_JOIN':
      case 'WORKSPACE_ROLE_CHANGE':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'ACHIEVEMENT':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'TASK_ASSIGNED':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50';
      case 'TASK_DUE_SOON':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50';
      case 'TASK_COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50';
      case 'INVITATION':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50';
      case 'WORKSPACE_JOIN':
      case 'WORKSPACE_ROLE_CHANGE':
        return 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50';
      case 'ACHIEVEMENT':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/50';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? `Showing all notifications (${notifications.length})` 
                : `Showing unread notifications (${unreadCount})`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="flex items-center gap-1.5"
            >
              <Bell className="h-4 w-4" />
              <span>All</span>
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="flex items-center gap-1.5"
            >
              <BellOff className="h-4 w-4" />
              <span>Unread</span>
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-rose-500 text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          <Button 
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5"
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4" />
            <span>Mark all as read</span>
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto bg-rose-100 dark:bg-rose-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load notifications</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <BellOff className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications at the moment."
                : "Your notifications will appear here when you have updates."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`
                  p-4 flex items-start gap-4 transition-colors
                  ${!notification.isRead 
                    ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}
                `}
              >
                <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                  {getNotificationTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  
                  {notification.linkTo && (
                    <Link 
                      href={notification.linkTo}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      View details
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 h-9 w-9 sm:h-auto sm:w-auto"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Mark read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-500 p-2 h-9 w-9 sm:h-auto sm:w-auto"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}