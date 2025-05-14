"use client";

import { useState, useEffect, SetStateAction } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "./overview";
import { WorkspaceAnalytics } from "./workspace-analytics";
import { UserAnalytics } from "./user-analytics";
import { DateRangePicker } from "./date-range-picker";
import { TeamPerformance } from "./team-performance";
import { Loader2 } from "lucide-react";
import { ProductivityTrends } from "./productivity-trends";

interface Workspace {
  id: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DateRange {
  from: Date;
  to: Date;
}

export const AnalyticsView = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [workspaceAnalytics, setWorkspaceAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces/me");
        if (!response.ok) {
          throw new Error(`Failed to fetch workspaces: ${response.status}`);
        }
        const data = await response.json();
        
        // Make sure we're getting the right data structure
        if (Array.isArray(data)) {
          setWorkspaces(data);
          if (data.length > 0) {
            setSelectedWorkspace(data[0].id);
          }
        } else if (data.workspaces && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
          if (data.workspaces.length > 0) {
            setSelectedWorkspace(data.workspaces[0].id);
          }
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      }
    };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        let url = `/api/analytics`;
        const params = new URLSearchParams();
        
        if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
        if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        // Fetch overall analytics
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }
        const data = await response.json();
        setAnalytics(data);
        
        // Fetch user analytics
        const userUrl = `/api/analytics/user${params.toString() ? '?' + params.toString() : ''}`;
        const userResponse = await fetch(userUrl);
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user analytics: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        setUserAnalytics(userData);
        
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    const fetchWorkspaceAnalytics = async () => {
      if (!selectedWorkspace) return;
      
      try {
        let url = `/api/analytics/${selectedWorkspace}`;
        const params = new URLSearchParams();
        
        if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
        if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch workspace analytics: ${response.status}`);
        }
        const data = await response.json();
        setWorkspaceAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch workspace analytics:", error);
      }
    };

    fetchWorkspaceAnalytics();
  }, [selectedWorkspace, dateRange]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
  };

  const handleDateRangeChange = (range: SetStateAction<{ from: Date; to: Date; }>) => {
    setDateRange(range);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin my-auto" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="user">My Tasks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {analytics && <Overview data={analytics} />}
        </TabsContent>
        
        <TabsContent value="workspace">
          <div className="mb-4">
            <select 
              className="form-select w-full max-w-xs p-2 border rounded-md bg-transparent"
              value={selectedWorkspace || ""}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
            >
              <option value="" disabled>Select a workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
          {workspaceAnalytics && <WorkspaceAnalytics data={workspaceAnalytics} />}
        </TabsContent>
        
        <TabsContent value="user">
          {userAnalytics && <UserAnalytics data={userAnalytics} />}
        </TabsContent>
        
        <TabsContent value="trends">
          <ProductivityTrends startDate={dateRange.from} endDate={dateRange.to} />
        </TabsContent>
        
        <TabsContent value="team">
          <TeamPerformance workspaceId={selectedWorkspace || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
};