'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Reusing the formatting function from Navbar
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
    deleteNotification 
  } = useNotifications(50, true, filter === 'unread');

  // Get notification type icon based on type
  const getNotificationTypeIcon = (type: string) => {
    switch(type) {
      case 'TASK_ASSIGNED':
      case 'TASK_DUE_SOON':
      case 'TASK_COMPLETED':
        return '📋';
      case 'INVITATION':
        return '✉️';
      case 'WORKSPACE_JOIN':
      case 'WORKSPACE_ROLE_CHANGE':
        return '👥';
      default:
        return '🔔';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`px-6 py-4 flex items-start ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="mr-4 text-xl">
                  {getNotificationTypeIcon(notification.type)}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  
                  {notification.linkTo && (
                    <Link 
                      href={notification.linkTo}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      View details
                    </Link>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
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