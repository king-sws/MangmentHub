/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDistributionChart } from "./status-distribution-chart";
import { BoardCompletionChart } from "./board-completion-chart";

interface WorkspaceAnalyticsProps {
  data: {
    overview: {
      totalBoards: number;
      totalCards: number;
      workspaceCompletionRate: number;
      cardsDueThisWeek: number;
    };
    boardCompletionRates: any; // Replace 'any' with the actual type if known
    cardsByStatus: any; // Replace 'any' with the actual type if known
  };
}

export const WorkspaceAnalytics = ({ data }: WorkspaceAnalyticsProps) => {
  const { overview, boardCompletionRates, cardsByStatus } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Boards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalBoards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalCards}</div>
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
              {overview.workspaceCompletionRate.toFixed(1)}%
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
            <div className="text-3xl font-bold">{overview.cardsDueThisWeek}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <StatusDistributionChart data={cardsByStatus} />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Board Completion Rates</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <BoardCompletionChart data={boardCompletionRates} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};