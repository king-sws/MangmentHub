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
    <div className="min-h-screen w-full">
      {/* Container with proper padding and max-width */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header section */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Analytics Dashboard
            </h1>
            <div className="flex-shrink-0">
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            </div>
          </div>
        </div>

        {/* Tabs container */}
        <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
          {/* Responsive tabs list */}
          <div className="mb-6 overflow-x-auto">
            <TabsList className="inline-flex min-w-full sm:min-w-0 w-full sm:w-auto">
              <TabsTrigger value="overview" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="workspace" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Workspace
              </TabsTrigger>
              <TabsTrigger value="user" className="flex-1 sm:flex-none text-xs sm:text-sm">
                My Tasks
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Trends
              </TabsTrigger>
              <TabsTrigger value="team" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Team
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab contents */}
          <div className="w-full overflow-hidden">
            <TabsContent value="overview" className="mt-0">
              {isLoading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              ) : analytics ? (
                <div className="w-full">
                  <Overview data={analytics} />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No analytics data available
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="workspace" className="mt-0">
              <div className="mb-4 sm:mb-6">
                <select 
                  className="w-full sm:max-w-xs p-2 sm:p-3 border rounded-md bg-transparent text-sm sm:text-base"
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
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              ) : workspaceAnalytics ? (
                <div className="w-full">
                  <WorkspaceAnalytics data={workspaceAnalytics} />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Select a workspace to view analytics
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="user" className="mt-0">
              {isLoading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              ) : userAnalytics ? (
                <div className="w-full">
                  <UserAnalytics data={userAnalytics} />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No user analytics data available
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="trends" className="mt-0">
              <div className="w-full">
                <ProductivityTrends startDate={dateRange.from} endDate={dateRange.to} />
              </div>
            </TabsContent>
            
            <TabsContent value="team" className="mt-0">
              {!selectedWorkspace ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base mb-4">
                    Please select a workspace first
                  </p>
                  <div className="flex justify-center">
                    <select 
                      className="w-full sm:max-w-xs p-2 sm:p-3 border rounded-md bg-transparent text-sm sm:text-base"
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
                <div className="w-full">
                  <TeamPerformance workspaceId={selectedWorkspace} />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};