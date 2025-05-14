"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDistributionChart } from "./status-distribution-chart";
import { CompletionRateChart } from "./completion-rate-chart";

type OverviewData = {
  overview: {
    totalWorkspaces: number;
    totalBoards: number;
    totalCards: number;
    completionRate: number;
    completedCards: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cardsByStatus: any; // Replace 'any' with a more specific type if available
};

interface OverviewProps {
  data: OverviewData;
}

export const Overview = ({ data }: OverviewProps) => {
  const { overview, cardsByStatus } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalWorkspaces}</div>
          </CardContent>
        </Card>
        
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
              {overview.completionRate.toFixed(1)}%
            </div>
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
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <CompletionRateChart
              completed={overview.completedCards}
              total={overview.totalCards}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};