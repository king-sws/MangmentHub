/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationsPage() {
  const router = useRouter();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(50, false);

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const handleToggleUnread = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.linkTo) {
      router.push(notification.linkTo);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋';
      case 'TASK_DUE_SOON':
        return '⏰';
      case 'TASK_COMPLETED':
        return '✅';
      case 'TASK_COMMENT':
        return '💬';
      case 'INVITATION':
        return '✉️';
      case 'WORKSPACE_JOIN':
        return '👥';
      case 'WORKSPACE_ROLE_CHANGE':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="unread-only" 
              checked={showUnreadOnly} 
              onCheckedChange={handleToggleUnread} 
            />
            <Label htmlFor="unread-only">Show unread only</Label>
          </div>
          
          <Button 
            onClick={fetchNotifications} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-4">
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-20 mt-2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error loading notifications. Please try again.</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="mb-4">
          <CardContent className="p-4 text-center py-8">
            <p className="text-gray-500">No notifications to display</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={`mb-4 ${!notification.isRead ? 'border-blue-200 bg-blue-50' : ''}`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {getNotificationTypeIcon(notification.type)}
                    </span>
                    <CardTitle className="text-base font-medium">
                      {notification.title}
                    </CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs mt-1">
                  {formatDate(notification.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm">{notification.message}</p>
              </CardContent>
              {notification.linkTo && (
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    Go to details
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}