"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface TeamPerformanceProps {
  workspaceId: string;
}

interface TeamMetric {
  userId: string;
  name: string;
  metrics: {
    totalAssigned: number;
    completed: number;
    completionRate: number;
    cardsByStatus: {
      BACKLOG: number;
      TODO: number;
      IN_PROGRESS: number;
      IN_REVIEW: number;
      DONE: number;
    };
  };
}

export const TeamPerformance = ({ workspaceId }: TeamPerformanceProps) => {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamMetric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!workspaceId) {
        setLoading(false);
        return;
      }
     
      try {
        setLoading(true);
        setError(null);
       
        const response = await fetch(`/api/analytics/team/${workspaceId}`);
       
        if (!response.ok) {
          throw new Error(`Failed to fetch team data: ${response.status}`);
        }
       
        const data = await response.json();
       
        if (data.teamMetrics && Array.isArray(data.teamMetrics)) {
          setTeamData(data.teamMetrics);
        } else {
          setError("Invalid team data format received from server");
          console.error("Invalid team data format:", data);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch team analytics");
        console.error("Failed to fetch team analytics:", error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchTeamData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 animate-spin" />
        <span>Loading team performance data...</span>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
        <p className="text-sm mt-2 text-muted-foreground">Please try again later or contact support</p>
      </div>
    );
  }

  if (!teamData || teamData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No team data available for this workspace</p>
        {!workspaceId && <p className="text-sm mt-2">Please select a workspace to view team performance</p>}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((member) => (
              <TableRow key={`team-member-${member.userId}`}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.metrics.totalAssigned}</TableCell>
                <TableCell>{member.metrics.completed}</TableCell>
                <TableCell>{member.metrics.completionRate.toFixed(1)}%</TableCell>
                <TableCell className="w-[200px]">
                  <Progress
                    value={member.metrics.completionRate}
                    className="h-2"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};