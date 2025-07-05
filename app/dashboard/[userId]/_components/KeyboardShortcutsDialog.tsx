/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Search, 
  Command, 
  Plus, 
  X, 
  CheckSquare, 
  Layout, 
  Home, 
  User2, 
  CreditCard, 
  ChevronRight, 
  Shield, 
  RotateCcw, 
  User, 
  MessageSquare, 
  Menu, 
  LogOut,
  Keyboard,
  Zap,
  Settings,
  HelpCircle,
  ExternalLink,
  Copy,
  Edit,
  Archive,
  Star,
  Share,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Hash,
  Type,
  MousePointer,
  Monitor,
  ChevronDown
} from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);

  type ShortcutCategory = {
    category: string;
    icon: React.ReactNode;
    color: string;
    items: { key: string[]; description: string; action: string; isNew?: boolean; isPro?: boolean }[];
  };
  
  const [filteredShortcuts, setFilteredShortcuts] = useState<ShortcutCategory[]>([]);

  // Enhanced keyboard shortcuts data with icons and categories
  const shortcuts: ShortcutCategory[] = [
    {
      category: 'General',
      icon: <Zap className="h-4 w-4" />,
      color: 'from-blue-500 to-indigo-600',
      items: [
        { key: ['⌘', 'K'], description: 'Open search', action: 'Search anything', isNew: true },
        { key: ['⌘', 'N'], description: 'New workspace', action: 'Create new workspace' },
        { key: ['⌘', 'Shift', 'N'], description: 'New board', action: 'Create new board' },
        { key: ['⌘', 'Enter'], description: 'Quick action', action: 'Open quick actions menu' },
        { key: ['Esc'], description: 'Close dialog', action: 'Close any open dialog' },
        { key: ['⌘', ','], description: 'Open settings', action: 'Open user settings' },
        { key: ['⌘', 'Shift', 'P'], description: 'Command palette', action: 'Open command palette', isPro: true },
        { key: ['⌘', 'R'], description: 'Refresh', action: 'Refresh current view' },
        { key: ['⌘', '?'], description: 'Help center', action: 'Open help documentation' },
        { key: ['⌘', 'Shift', 'K'], description: 'Keyboard shortcuts', action: 'Show this dialog' },
      ]
    },
    {
      category: 'Navigation',
      icon: <MousePointer className="h-4 w-4" />,
      color: 'from-emerald-500 to-teal-600',
      items: [
        { key: ['⌘', '1'], description: 'Go to dashboard', action: 'Navigate to dashboard' },
        { key: ['⌘', '2'], description: 'Go to workspaces', action: 'Navigate to workspaces' },
        { key: ['⌘', '3'], description: 'Go to tasks', action: 'Navigate to tasks' },
        { key: ['⌘', '4'], description: 'Go to calendar', action: 'Navigate to calendar' },
        { key: ['⌘', '5'], description: 'Go to reports', action: 'Navigate to reports', isPro: true },
        { key: ['⌘', 'B'], description: 'Toggle sidebar', action: 'Show/hide sidebar' },
        { key: ['⌘', 'Shift', 'B'], description: 'Toggle notifications', action: 'Show/hide notifications' },
        { key: ['G', 'H'], description: 'Go home', action: 'Navigate to home' },
        { key: ['G', 'W'], description: 'Go to workspace', action: 'Navigate to workspace' },
        { key: ['⌘', 'Shift', 'Tab'], description: 'Previous tab', action: 'Go to previous tab' },
        { key: ['⌘', 'Tab'], description: 'Next tab', action: 'Go to next tab' },
      ]
    },
    {
      category: 'Tasks & Projects',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'from-purple-500 to-pink-600',
      items: [
        { key: ['⌘', 'T'], description: 'New task', action: 'Create new task' },
        { key: ['⌘', 'Shift', 'T'], description: 'New project', action: 'Create new project' },
        { key: ['⌘', 'E'], description: 'Edit task', action: 'Edit selected task' },
        { key: ['⌘', 'D'], description: 'Duplicate task', action: 'Duplicate selected task' },
        { key: ['⌘', 'Shift', 'D'], description: 'Delete task', action: 'Delete selected task' },
        { key: ['⌘', 'U'], description: 'Mark complete', action: 'Toggle task completion' },
        { key: ['⌘', 'Shift', 'U'], description: 'Mark important', action: 'Toggle task importance' },
        { key: ['⌘', 'M'], description: 'Move task', action: 'Move task to different list' },
        { key: ['⌘', 'L'], description: 'Add label', action: 'Add label to task', isNew: true },
        { key: ['⌘', 'Shift', 'L'], description: 'Assign task', action: 'Assign task to team member', isPro: true },
      ]
    },
    {
      category: 'Editing',
      icon: <Edit className="h-4 w-4" />,
      color: 'from-orange-500 to-red-600',
      items: [
        { key: ['⌘', 'Z'], description: 'Undo', action: 'Undo last action' },
        { key: ['⌘', 'Shift', 'Z'], description: 'Redo', action: 'Redo last undone action' },
        { key: ['⌘', 'C'], description: 'Copy', action: 'Copy selected item' },
        { key: ['⌘', 'V'], description: 'Paste', action: 'Paste copied item' },
        { key: ['⌘', 'X'], description: 'Cut', action: 'Cut selected item' },
        { key: ['⌘', 'A'], description: 'Select all', action: 'Select all items' },
        { key: ['⌘', 'S'], description: 'Save', action: 'Save current changes' },
        { key: ['⌘', 'F'], description: 'Find', action: 'Find in current view' },
        { key: ['⌘', 'G'], description: 'Find next', action: 'Find next match' },
        { key: ['⌘', 'Shift', 'G'], description: 'Find previous', action: 'Find previous match' },
      ]
    },
    {
      category: 'Text Formatting',
      icon: <Type className="h-4 w-4" />,
      color: 'from-cyan-500 to-blue-600',
      items: [
        { key: ['⌘', 'B'], description: 'Bold', action: 'Make text bold' },
        { key: ['⌘', 'I'], description: 'Italic', action: 'Make text italic' },
        { key: ['⌘', 'U'], description: 'Underline', action: 'Underline text' },
        { key: ['⌘', 'Shift', 'C'], description: 'Code', action: 'Format as code' },
        { key: ['⌘', 'K'], description: 'Link', action: 'Create link' },
        { key: ['⌘', 'Shift', 'L'], description: 'Bullet list', action: 'Create bullet list' },
        { key: ['⌘', 'Shift', 'O'], description: 'Numbered list', action: 'Create numbered list' },
        { key: ['⌘', 'Shift', 'Q'], description: 'Quote', action: 'Create quote block' },
        { key: ['⌘', 'Shift', 'H'], description: 'Heading', action: 'Create heading', isNew: true },
        { key: ['⌘', 'Shift', 'X'], description: 'Strike through', action: 'Strike through text' },
      ]
    },
    {
      category: 'View & Display',
      icon: <Monitor className="h-4 w-4" />,
      color: 'from-violet-500 to-purple-600',
      items: [
        { key: ['⌘', 'Shift', 'F'], description: 'Full screen', action: 'Toggle full screen' },
        { key: ['⌘', 'Shift', 'D'], description: 'Dark mode', action: 'Toggle dark mode' },
        { key: ['⌘', '+'], description: 'Zoom in', action: 'Increase zoom level' },
        { key: ['⌘', '-'], description: 'Zoom out', action: 'Decrease zoom level' },
        { key: ['⌘', '0'], description: 'Reset zoom', action: 'Reset zoom to default' },
        { key: ['⌘', 'Shift', 'R'], description: 'Refresh data', action: 'Refresh all data' },
        { key: ['F11'], description: 'Presentation mode', action: 'Enter presentation mode', isPro: true },
        { key: ['⌘', 'Shift', 'H'], description: 'Hide completed', action: 'Hide completed tasks' },
        { key: ['⌘', 'Shift', 'I'], description: 'Focus mode', action: 'Enable focus mode', isNew: true },
        { key: ['⌘', 'Shift', 'E'], description: 'Export view', action: 'Export current view', isPro: true },
      ]
    }
  ];

  // Filter shortcuts based on search query and selected category
  useEffect(() => {
    let filtered = shortcuts;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(category => category.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.map(category => ({
        ...category,
        items: category.items.filter(shortcut => 
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.key.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })).filter(category => category.items.length > 0);
    }

    setFilteredShortcuts(filtered);
  }, [searchQuery, selectedCategory]);

  // Close dialog on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Auto-enable compact view on mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsCompactView(isMobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const categories = shortcuts.map(s => s.category);
  const totalShortcuts = shortcuts.reduce((acc, cat) => acc + cat.items.length, 0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[95vh] bg-card backdrop-blur-xl rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header - More compact on mobile */}
        <div className="sticky top-0 z-10 px-4 sm:px-8 py-3 sm:py-6 bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center border border-indigo-200/30 dark:border-indigo-700/30 flex-shrink-0">
                <Keyboard className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-2xl font-bold text-foreground truncate">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:flex items-center gap-2">
                  <span>Boost your productivity with {totalShortcuts} shortcuts</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Pro tips
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg sm:rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Search Bar - Simplified on mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full h-10 sm:h-12 pl-10 pr-4 bg-background/80 border border-border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          {/* Category Pills - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/80 text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background/80 text-muted-foreground hover:bg-accent'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Optimized for mobile */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-8 h-[calc(100vh-140px)] sm:h-auto sm:max-h-[calc(95vh-240px)] hide-scrollbar">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 sm:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">
                No shortcuts found
              </p>
              <p className="text-sm text-muted-foreground px-4">
                Try different keywords or categories
              </p>
            </div>
          ) : (
            filteredShortcuts.map((category, categoryIndex) => (
              <div key={category.category} className="space-y-3 sm:space-y-6">
                {/* Category Header - Simplified on mobile */}
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br ${category.color} rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      {category.category}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                      {category.items.length} shortcuts
                    </p>
                  </div>
                </div>
                
                {/* Shortcuts Grid - Mobile optimized */}
                <div className="space-y-2 sm:space-y-0 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="group p-3 sm:p-4 bg-card hover:bg-accent/50 rounded-lg sm:rounded-xl transition-all duration-200 border border-border/50 hover:border-primary/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm truncate">
                              {shortcut.description}
                            </h4>
                            {shortcut.isNew && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex-shrink-0">
                                <Sparkles className="h-2 w-2" />
                                {!isMobile && "New"}
                              </span>
                            )}
                            {shortcut.isPro && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex-shrink-0">
                                <Star className="h-2 w-2" />
                                {!isMobile && "Pro"}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs sm:text-sm truncate">
                            {shortcut.action}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {shortcut.key.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                              <kbd className="px-1.5 py-1 sm:px-2 sm:py-1.5 font-mono font-medium text-foreground bg-background border border-border rounded shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all duration-200 text-xs">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Minimal on mobile */}
        <div className="sticky bottom-0 px-4 sm:px-8 py-3 sm:py-6 bg-card/95 backdrop-blur-xl border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">
                  Esc
                </kbd>
                <span>Close</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">
                  ⌘K
                </kbd>
                <span>Search</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="hidden sm:inline">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="hidden sm:inline">Pro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};