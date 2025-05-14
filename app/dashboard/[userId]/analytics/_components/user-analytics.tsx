"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";

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
    cardsByWorkspace: Array<{
      workspaceId: string;
      name: string;
      total: number;
      completed: number;
    }>;
  };
}

const STATUS_COLORS = {
  BACKLOG: "#94a3b8",
  TODO: "#38bdf8",
  IN_PROGRESS: "#a78bfa",
  IN_REVIEW: "#fbbf24",
  DONE: "#4ade80"
};

const STATUS_LABELS = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done"
};

export const UserAnalytics = ({ data }: UserAnalyticsProps) => {
  const { overview, cardsByStatus, cardsByWorkspace } = data;
  
  // Prepare data for status chart
  const statusChartData = Object.keys(cardsByStatus).map(statusKey => {
    const status = statusKey as keyof typeof STATUS_LABELS;
    return {
      name: STATUS_LABELS[status] || status,
      value: cardsByStatus[status],
      status
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Tasks
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
            <CardTitle>My Task Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tasks by Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cardsByWorkspace.map((workspace) => {
                const completionRate = workspace.total > 0 
                  ? (workspace.completed / workspace.total) * 100 
                  : 0;
                
                return (
                  <div key={`workspace-${workspace.workspaceId}`} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{workspace.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {workspace.completed} / {workspace.total} ({completionRate.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};