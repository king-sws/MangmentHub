/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  ChevronDown,
  Check,
  Settings2,
  Users,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

const PRESET_FILTERS = [
  { id: 'all', label: 'All Tasks', filters: {} },
  { id: 'pending', label: 'Pending', filters: { status: ['TODO', 'IN_PROGRESS'] } },
  { id: 'completed', label: 'Completed', filters: { status: ['DONE'] } },
  { id: 'overdue', label: 'Overdue', filters: { overdue: true } },
  { id: 'today', label: 'Due Today', filters: { dueToday: true } },
  { id: 'this-week', label: 'This Week', filters: { dueThisWeek: true } },
];

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'DONE', label: 'Done', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'BLOCKED', label: 'Blocked', color: 'bg-red-100 text-red-700 border-red-200' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
];

interface FilterState {
  search: string;
  status: string[];
  priority: string[];
  projects: string[];
  assignees: string[];
  dueDate: {
    from?: Date;
    to?: Date;
  };
  overdue: boolean;
  dueToday: boolean;
  dueThisWeek: boolean;
}

interface ProfessionalTaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  projects: Array<{ id: string; title: string; color?: string }>;
  assignees: Array<{ id: string; name: string; avatar?: string }>;
  taskCount: number;
  className?: string;
}

const MultiSelectFilter = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  renderOption 
}: {
  options: any[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  renderOption?: (option: any) => React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[150px] h-9",
            value.length > 0 && "border-primary/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {value.length === 0 
                ? placeholder 
                : value.length === 1 
                  ? options.find(opt => opt.value === value[0])?.label || value[0]
                  : `${value.length} selected`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {value.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => toggleOption(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {renderOption ? renderOption(option) : (
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <div className={cn("h-2 w-2 rounded-full", option.color)} />
                      )}
                      <span>{option.label}</span>
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {value.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange([])}
                  className="w-full justify-center text-xs"
                >
                  Clear selection
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const QuickFilterChips = ({ 
  activePreset, 
  onPresetChange 
}: {
  activePreset: string;
  onPresetChange: (preset: string) => void;
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_FILTERS.map((preset) => (
        <Button
          key={preset.id}
          variant={activePreset === preset.id ? "default" : "outline"}
          size="sm"
          onClick={() => onPresetChange(preset.id)}
          className="h-8 text-xs"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
};

export default function ProfessionalTaskFilters({ 
  filters, 
  onFiltersChange, 
  projects, 
  assignees, 
  taskCount,
  className 
}: ProfessionalTaskFiltersProps) {
  const [activePreset, setActivePreset] = useState('all');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value });
  }, [filters, onFiltersChange]);

  const handlePresetChange = (presetId: string) => {
    setActivePreset(presetId);
    const preset = PRESET_FILTERS.find(p => p.id === presetId);
    if (preset) {
      onFiltersChange({
        ...filters,
        ...preset.filters,
        // Reset specific filters when changing preset
        status: preset.filters.status || [],
        overdue: preset.filters.overdue || false,
        dueToday: preset.filters.dueToday || false,
        dueThisWeek: preset.filters.dueThisWeek || false,
      });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      priority: [],
      projects: [],
      assignees: [],
      dueDate: {},
      overdue: false,
      dueToday: false,
      dueThisWeek: false,
    });
    setActivePreset('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.projects.length > 0) count++;
    if (filters.assignees.length > 0) count++;
    if (filters.dueDate.from || filters.dueDate.to) count++;
    if (filters.overdue) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks by title, description, or tags..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4 h-10"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Quick Filters</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {taskCount} tasks
            </Badge>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <QuickFilterChips 
          activePreset={activePreset} 
          onPresetChange={handlePresetChange}
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isAdvancedOpen && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedOpen && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Status Filter */}
            <MultiSelectFilter
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(status) => onFiltersChange({ ...filters, status })}
              placeholder="Status"
              icon={Tag}
              renderOption={(option) => (
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", option.color)} />
                  <span>{option.label}</span>
                </div>
              )}
            />

            {/* Priority Filter */}
            <MultiSelectFilter
              options={PRIORITY_OPTIONS}
              value={filters.priority}
              onChange={(priority) => onFiltersChange({ ...filters, priority })}
              placeholder="Priority"
              icon={Filter}
              renderOption={(option) => (
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", option.color)} />
                  <span>{option.label}</span>
                </div>
              )}
            />

            {/* Projects Filter */}
            <MultiSelectFilter
              options={projects.map(p => ({ value: p.id, label: p.title, color: p.color }))}
              value={filters.projects}
              onChange={(projects) => onFiltersChange({ ...filters, projects })}
              placeholder="Projects"
              icon={Filter}
              renderOption={(option) => (
                <div className="flex items-center gap-2">
                  <div className={cn("h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center")}>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {option.label.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{option.label}</span>
                </div>
              )}
            />

            {/* Assignees Filter */}
            <MultiSelectFilter
              options={assignees.map(a => ({ value: a.id, label: a.name, avatar: a.avatar }))}
              value={filters.assignees}
              onChange={(assignees) => onFiltersChange({ ...filters, assignees })}
              placeholder="Assignees"
              icon={Users}
              renderOption={(option) => (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    {option.avatar ? (
                      <img src={option.avatar} alt={option.label} className="h-6 w-6 rounded-full" />
                    ) : (
                      <span className="text-xs font-medium">
                        {option.label.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              )}
            />

            {/* Due Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-between min-w-[150px] h-9",
                    (filters.dueDate.from || filters.dueDate.to) && "border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {filters.dueDate.from || filters.dueDate.to ? "Custom Range" : "Due Date"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From</label>
                    <Input
                      type="date"
                      value={filters.dueDate.from?.toISOString().split('T')[0] || ''}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        dueDate: {
                          ...filters.dueDate,
                          from: e.target.value ? new Date(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To</label>
                    <Input
                      type="date"
                      value={filters.dueDate.to?.toISOString().split('T')[0] || ''}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        dueDate: {
                          ...filters.dueDate,
                          to: e.target.value ? new Date(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({
                      ...filters,
                      dueDate: {}
                    })}
                    className="w-full justify-center text-xs"
                  >
                    Clear dates
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Special Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Special Filters</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.overdue ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({
                  ...filters,
                  overdue: !filters.overdue
                })}
                className="h-8 text-xs"
              >
                Overdue Tasks
              </Button>
              <Button
                variant={filters.dueToday ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({
                  ...filters,
                  dueToday: !filters.dueToday
                })}
                className="h-8 text-xs"
              >
                Due Today
              </Button>
              <Button
                variant={filters.dueThisWeek ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({
                  ...filters,
                  dueThisWeek: !filters.dueThisWeek
                })}
                className="h-8 text-xs"
              >
                Due This Week
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status.length} selected
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, status: [] })}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.projects.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Projects: {filters.projects.length} selected
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, projects: [] })}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {/* Add more filter badges as needed */}
        </div>
      )}
    </div>
  );
}