// hooks/useNotifications.ts
import { useState, useEffect } from "react";
import axios from "axios";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkTo: string | null;
  createdAt: string;
  relatedId: string | null;
}

export function useNotifications(limit = 10, autoRefresh = false, unreadOnly = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/notifications?limit=${limit}${unreadOnly ? '&unreadOnly=true' : ''}`
      );
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      setError(null);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}`, { isRead: true });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      
      // Remove from local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [limit, autoRefresh, unreadOnly]); // Re-run when these props change

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}