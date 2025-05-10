'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';

export default function NotificationDebugger() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(20, false);

  const [testUserId, setTestUserId] = useState('');
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testMessage, setTestMessage] = useState('This is a test notification message');
  const [testType, setTestType] = useState('TEST');
  const [testLink, setTestLink] = useState('/dashboard');
  const [createStatus, setCreateStatus] = useState('');

  const createTestNotification = async () => {
    try {
      setCreateStatus('Creating...');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post('/api/notifications', {
        userId: testUserId,
        title: testTitle,
        message: testMessage,
        type: testType,
        linkTo: testLink || undefined
      });
      setCreateStatus('Created successfully!');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to create test notification:', error);
      setCreateStatus('Failed to create notification');
    }
  };

  const checkNotificationsTable = async () => {
    try {
      const response = await axios.get('/api/debug/notifications');
      console.log('Notifications check:', response.data);
      alert(`Total notifications in DB: ${response.data.count}`);
    } catch (error) {
      console.error('Failed to check notifications:', error);
      alert('Failed to check notifications. See console for details.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notification Debugger</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create Test Notification</h2>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <Input
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="User ID to receive notification"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Notification message"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="TEST">TEST</option>
              <option value="TASK_ASSIGNED">TASK_ASSIGNED</option>
              <option value="TASK_DUE_SOON">TASK_DUE_SOON</option>
              <option value="TASK_COMPLETED">TASK_COMPLETED</option>
              <option value="INVITATION">INVITATION</option>
              <option value="WORKSPACE_JOIN">WORKSPACE_JOIN</option>
              <option value="WORKSPACE_ROLE_CHANGE">WORKSPACE_ROLE_CHANGE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Link (optional)</label>
            <Input
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              placeholder="/dashboard/path"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={createTestNotification}>Create Notification</Button>
            <Button variant="outline" onClick={fetchNotifications}>Refresh List</Button>
            <Button variant="outline" onClick={checkNotificationsTable}>Check DB</Button>
            {createStatus && (
              <span className={createStatus.includes('Failed') ? 'text-red-500' : 'text-green-500'}>
                {createStatus}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Notifications ({unreadCount} unread)</h2>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No notifications</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 rounded-md border ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <div className="flex mt-2 text-xs text-gray-500 space-x-4">
                      <span>Type: {notification.type}</span>
                      <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.linkTo && <span>Link: {notification.linkTo}</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600"
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}