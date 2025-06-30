/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Search, Hash, Lock, Users, Plus, Send, Settings, MoreVertical, 
  Smile, Paperclip, Phone, Video, Bell, Archive, Star, 
  MessageSquare, AlertCircle, CheckCircle2, Clock, Loader2
} from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  unreadCount?: number;
  lastActivity?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  _count?: {
    members: number;
    messages: number;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  isEdited?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    status?: 'online' | 'away' | 'offline';
  };
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EnterpriseChatInterface() {
  const params = useParams();
  const workspaceId = params && typeof params.workspaceId === 'string' ? params.workspaceId : Array.isArray(params?.workspaceId) ? params?.workspaceId[0] : undefined;
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus message input when room is selected
  useEffect(() => {
    if (selectedRoom && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedRoom]);
  
  // Fetch chat rooms on component mount
  useEffect(() => {
    if (workspaceId) {
      fetchChatRooms();
    }
  }, [workspaceId]);
  
  // Fetch messages when a room is selected
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom);
    }
  }, [selectedRoom]);
  
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);
  
  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat rooms');
      }
      const data = await response.json();
      setRooms(data);
      setError(null);
      
      // Auto-select first room if none selected
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0].id);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      showToast('error', errorMessage);
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (roomId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/messages`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
      
      // Mark room as read
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      ));
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      showToast('error', errorMessage);
      console.error('Error fetching messages:', err);
    }
  };
  
  const createChatRoom = async () => {
    if (!newRoomName.trim()) return;
    
    setLoading(true);
    
    try {
      const roomData = {
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
        isPrivate: isPrivate,
        initialMembers: []
      };
      
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to create chat room');
      }
      
      const newRoom = await response.json();
      
      // Reset form and refresh room list
      setNewRoomName('');
      setNewRoomDesc('');
      setIsPrivate(false);
      setShowCreateRoom(false);
      setError(null);
      
      // Add new room to list and select it
      setRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom.id);
      
      showToast('success', `Channel "${newRoom.name}" created successfully`);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      showToast('error', errorMessage);
      console.error('Error creating chat room:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;
    
    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      const messageData = {
        content: messageContent,
      };
      
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${selectedRoom}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const sentMessage = await response.json();
      setMessages(prev => [...prev, sentMessage]);
      setError(null);
      setIsTyping(false);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      showToast('error', errorMessage);
      setNewMessage(messageContent); // Restore message on error
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    setIsTyping(value.length > 0);
  }, []);
  
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) && !room.isArchived
  );
  
  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };
  
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-gray-900 text-white flex flex-col transition-all duration-200 border-r border-gray-800`}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white">Workspace</h1>
                <div className="flex items-center text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowCreateRoom(true)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-2 top-4 p-1 hover:bg-gray-800 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Channels Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Channels</h3>
                  <span className="text-xs text-gray-500">{filteredRooms.length}</span>
                </div>
                
                <div className="space-y-1">
                  {loading && filteredRooms.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`group flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                          selectedRoom === room.id 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-gray-800 text-gray-300'
                        }`}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {room.isPrivate ? (
                            <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                          ) : (
                            <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="font-medium truncate">{room.name}</span>
                              {room.unreadCount && room.unreadCount > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {room._count?.members || 0} members
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1 hover:bg-gray-700 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle favorite
                            }}
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button 
                            className="p-1 hover:bg-gray-700 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              // More options
                            }}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {!loading && filteredRooms.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      {searchQuery ? 'No channels found' : 'No channels yet'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom && selectedRoomData ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {selectedRoomData.isPrivate ? (
                    <Lock className="w-5 h-5 mr-2 text-gray-500" />
                  ) : (
                    <Hash className="w-5 h-5 mr-2 text-gray-500" />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedRoomData.name}
                    </h2>
                    {selectedRoomData.description && (
                      <p className="text-sm text-gray-600">
                        {selectedRoomData.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Users className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Search className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  const showAvatar = index === 0 || messages[index - 1].user.id !== message.user.id;
                  return (
                    <div key={message.id} className={`flex ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                      <div className="w-10 flex-shrink-0">
                        {showAvatar && (
                          <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                              {message.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(message.user.status)} rounded-full border-2 border-white`}></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-baseline mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {message.user.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                            {message.isEdited && (
                              <span className="ml-1 text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                        )}
                        <div className="text-gray-900 text-sm leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation in #{selectedRoomData.name}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      ref={messageInputRef}
                      type="text"
                      placeholder={`Message #${selectedRoomData.name}`}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sendingMessage}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Smile className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {isTyping && (
                <div className="mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Typing...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">Welcome to your workspace</p>
              <p>Select a channel to start messaging or create a new one</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create a new channel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel name
                </label>
                <input
                  type="text"
                  placeholder="e.g. marketing"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="What's this channel about?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                  Make private
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createChatRoom}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-2" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}