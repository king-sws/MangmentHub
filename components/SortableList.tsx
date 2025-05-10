"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2, GripHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortableListProps {
  id: string;
  listId: string;
  title: string;
  children: ReactNode;
  onAddCard?: () => void;
  onDeleteList?: () => void;
}

export function SortableList({
  id,
  listId,
  title,
  children,
  onAddCard,
  onDeleteList
}: SortableListProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "list",
      listId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-72 ${isDragging ? 'scale-105' : ''} transition-transform duration-200`}
      data-list-id={listId}
    >
      <Card className="bg-gray-50 shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="p-0">
          <div
            className="p-3 border-b font-medium flex items-center justify-between bg-gray-100 rounded-t-md"
            {...attributes}
            {...listeners}
          >
            <div className="flex items-center cursor-grab group">
              <GripHorizontal className="h-4 w-4 mr-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-gray-800 font-medium text-sm truncate max-w-[180px]">{title}</span>
            </div>
            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                        <span className="sr-only">List options</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>List options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteList) onDeleteList();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-2 space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {children}
        </CardContent>
        <CardFooter className="p-2 pt-0">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 h-10 text-gray-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddCard) onAddCard();
            }}
            aria-label="Add a new card"
          >
            <Plus size={16} className="mr-2" />
            <span className="text-sm">Add Card</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}