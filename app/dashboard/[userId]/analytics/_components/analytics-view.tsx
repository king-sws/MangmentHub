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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("overview");

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
      if (activeTab !== "overview") return;
      
      setIsLoading(true);
      try {
        let url = `/api/analytics`;
        const params = new URLSearchParams();
        
        if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
        if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, activeTab]);

  // Separate effect for user analytics
  useEffect(() => {
    const fetchUserAnalytics = async () => {
      if (activeTab !== "user") return;
      
      setIsLoading(true);
      try {
        // Build URL with query parameters
        const url = new URL(`/api/analytics/user`, window.location.origin);
        
        if (dateRange.from) url.searchParams.append('startDate', dateRange.from.toISOString());
        if (dateRange.to) url.searchParams.append('endDate', dateRange.to.toISOString());
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch user analytics: ${response.status}`);
        }
        const data = await response.json();
        setUserAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch user analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAnalytics();
  }, [dateRange, activeTab]);

  useEffect(() => {
    const fetchWorkspaceAnalytics = async () => {
      if (!selectedWorkspace || activeTab !== "workspace") return;
      
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceAnalytics();
  }, [selectedWorkspace, dateRange, activeTab]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
  };

  const handleDateRangeChange = (range: SetStateAction<DateRange>) => {
    setDateRange(range);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Only set isLoading to true for tabs that need to fetch data
    if (["overview", "workspace", "user"].includes(value)) {
      setIsLoading(true);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="user">My Tasks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin my-auto" />
            </div>
          ) : analytics ? (
            <Overview data={analytics} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          )}
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
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin my-auto" />
            </div>
          ) : workspaceAnalytics ? (
            <WorkspaceAnalytics data={workspaceAnalytics} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Select a workspace to view analytics</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="user">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin my-auto" />
            </div>
          ) : userAnalytics ? (
            <UserAnalytics data={userAnalytics} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No user analytics data available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trends">
          <ProductivityTrends startDate={dateRange.from} endDate={dateRange.to} />
        </TabsContent>
        
        <TabsContent value="team">
          {!selectedWorkspace ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Please select a workspace first</p>
              <div className="mt-4">
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
            </div>
          ) : (
            <TeamPerformance workspaceId={selectedWorkspace} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};