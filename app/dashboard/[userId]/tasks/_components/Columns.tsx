/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tasks/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { CardWithDetails } from "./Types"
import { format } from "date-fns"

export const columns: ColumnDef<CardWithDetails>[] = [
  {
    accessorKey: "title",
    header: "Task Name",
  },
  {
    accessorKey: "list.board.title",
    header: "Project",
    cell: ({ row }) => row.original.list?.board?.title || 'Unassigned'
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status.toLowerCase() as any}>
        {row.original.status.replace('_', ' ')}
      </Badge>
    )
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => 
      row.original.dueDate ? format(new Date(row.original.dueDate), 'MMM dd, yyyy') : '-'
  },
  {
    accessorKey: "assignees",
    header: "Assignees",
    cell: ({ row }) => row.original.assignees
      .map(a => a.name || a.email?.split('@')[0])
      .join(', ')
  }
]