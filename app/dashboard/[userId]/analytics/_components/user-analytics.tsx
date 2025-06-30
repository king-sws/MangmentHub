/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface WorkspaceTaskStats {
  workspaceId: string;
  name: string;
  total: number;
  completed: number;
}

interface UserAnalyticsProps {
  data: {
    overview: {
      totalAssigned: number;
      completedCards: number;
      completionRate: number;
      cardsDueSoon: number;
    };
    cardsByStatus: {
      BACKLOG: number;
      TODO: number;
      IN_PROGRESS: number;
      IN_REVIEW: number;
      DONE: number;
    };
    cardsByWorkspace: WorkspaceTaskStats[];
    timestamp: string;
  };
}

export const UserAnalytics = ({ data }: UserAnalyticsProps) => {
  const { overview, cardsByStatus, cardsByWorkspace } = data;

  // Prepare data for status distribution chart
  const statusData = [
    { name: "Backlog", value: cardsByStatus.BACKLOG, color: "#94a3b8" },
    { name: "To Do", value: cardsByStatus.TODO, color: "#3b82f6" },
    { name: "In Progress", value: cardsByStatus.IN_PROGRESS, color: "#f59e0b" },
    { name: "In Review", value: cardsByStatus.IN_REVIEW, color: "#8b5cf6" },
    { name: "Done", value: cardsByStatus.DONE, color: "#22c55e" }
  ];

  // Filter out status categories with zero cards
  const filteredStatusData = statusData.filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalAssigned}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.completedCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview.completionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.cardsDueSoon}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {filteredStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {filteredStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} tasks`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No task data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>My Tasks by Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            {cardsByWorkspace && cardsByWorkspace.length > 0 ? (
              <div className="space-y-4">
                {cardsByWorkspace.map((workspace) => (
                  <div key={workspace.workspaceId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{workspace.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {workspace.completed} / {workspace.total} tasks
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded"
                        style={{ 
                          width: `${workspace.total > 0 ? (workspace.completed / workspace.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No workspace data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};