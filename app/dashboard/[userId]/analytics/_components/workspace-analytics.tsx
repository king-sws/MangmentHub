"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDistributionChart } from "./status-distribution-chart";
import { BoardCompletionChart } from "./board-completion-chart";
import { 
  Kanban, 
  CheckSquare, 
  TrendingUp, 
  Calendar,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

interface CardsByStatus {
  BACKLOG: number;
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}


interface WorkspaceAnalyticsProps {
  data: {
    overview: {
      totalBoards: number;
      totalCards: number;
      workspaceCompletionRate: number;
      cardsDueThisWeek: number;
    };
    boardCompletionRates: BoardCompletionChartData[];
    cardsByStatus: CardsByStatus;
  };
}

export const WorkspaceAnalytics = ({ data }: WorkspaceAnalyticsProps) => {
  const { overview, boardCompletionRates, cardsByStatus } = data;

  const metricCards = [
    {
      title: "Total Boards",
      value: overview.totalBoards,
      icon: Kanban,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      description: "Active project boards"
    },
    {
      title: "Total Tasks",
      value: overview.totalCards,
      icon: CheckSquare,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      description: "All workspace tasks"
    },
    {
      title: "Completion Rate",
      value: `${overview.workspaceCompletionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      description: "Overall progress"
    },
    {
      title: "Due This Week",
      value: overview.cardsDueThisWeek,
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      description: "Upcoming deadlines"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workspace Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Detailed insights into your workspace performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Last updated:</span>
          <span>just now</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metricCards.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                      {metric.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                      {metric.description}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${metric.bgColor} shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
                  Task Status Distribution
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Breakdown of task statuses across the workspace
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg shrink-0">
                <PieChartIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <StatusDistributionChart data={cardsByStatus} />
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
                  Board Completion Rates
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Progress comparison across all project boards
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg shrink-0">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <BoardCompletionChart data={boardCompletionRates} />
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Workspace Insights</CardTitle>
              <p className="text-sm text-muted-foreground">Key performance metrics for this workspace</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Average Tasks per Board</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {overview.totalBoards > 0 ? Math.round(overview.totalCards / overview.totalBoards) : 0}
              </div>
              <div className="text-xs text-muted-foreground">tasks per board</div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Weekly Workload</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {overview.cardsDueThisWeek}
              </div>
              <div className="text-xs text-muted-foreground">tasks due this week</div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 sm:col-span-2 lg:col-span-1">
              <div className="text-sm text-muted-foreground mb-1">Completion Progress</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {Math.round((overview.workspaceCompletionRate / 100) * overview.totalCards)}
              </div>
              <div className="text-xs text-muted-foreground">tasks completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};