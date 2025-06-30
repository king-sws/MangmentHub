/* eslint-disable @typescript-eslint/no-explicit-any */
// components/workspace/WorkspaceDiagnostics.tsx
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface WorkspaceInfo {
  diagnostics?: {
    requestedId: string;
    isValidUUID: boolean;
    workspaceExists: boolean;
    exactMatchInUserWorkspaces: boolean;
    membershipExists: boolean;
    possibleCaseIssue: boolean;
    totalSystemWorkspaces: number;
    userWorkspaceCount: number;
    membershipCount: number;
  };
  workspace?: any;
  userWorkspaces?: any[];
  userMemberships?: any[];
  recommendations?: string[];
  error?: string;
}

export default function WorkspaceDiagnostics() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fixStatus, setFixStatus] = useState("");

  useEffect(() => {
    // Extract current URL and potential workspace IDs
    const path = window.location.pathname;
    setCurrentUrl(path);
    
    // Try to extract workspace ID from URL
    const dashboardMatch = path.match(/\/dashboard\/([^\/]+)/);
    const workspaceMatch = path.match(/\/workspace\/([^\/]+)/);
    
    if (dashboardMatch && dashboardMatch[1]) {
      setWorkspaceId(dashboardMatch[1]);
    } else if (workspaceMatch && workspaceMatch[1]) {
      setWorkspaceId(workspaceMatch[1]);
    }
  }, []);

  const checkWorkspace = async () => {
    if (!workspaceId) {
      setError("Please enter a workspace ID");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setWorkspaceInfo(null);
    
    try {
      const response = await fetch(`/api/debug/workspace-diagnostics?workspaceId=${workspaceId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorkspaceInfo(data);
      } else {
        setError(data.error || "Failed to check workspace");
      }
    } catch (err) {
      setError("Error checking workspace");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fixWorkspaceMembership = async () => {
    if (!workspaceInfo?.workspace?.id) {
      setError("No valid workspace to fix");
      return;
    }
    
    setFixStatus("Fixing workspace membership...");
    
    try {
      // First check if the user already has membership
      const checkResponse = await fetch(`/api/debug/workspace-membership?workspaceId=${workspaceInfo.workspace.id}`);
      const checkData = await checkResponse.json();
      
      if (checkResponse.ok && checkData.isMember) {
        setFixStatus("You are already a member of this workspace");
        return;
      }
      
      // If not a member, add membership
      const response = await fetch(`/api/debug/add-workspace-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workspaceId: workspaceInfo.workspace.id,
          userId: checkData.userId,
          role: "MEMBER"
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFixStatus("Workspace membership fixed successfully!");
      } else {
        setFixStatus(`Failed to fix: ${data.error}`);
      }
    } catch (err) {
      setFixStatus("Error fixing workspace membership");
      console.error(err);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Workspace Diagnostics Tool</CardTitle>
        <CardDescription>
          Diagnose and fix workspace access issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Alert>
            <AlertTitle>Current URL</AlertTitle>
            <AlertDescription>{currentUrl}</AlertDescription>
          </Alert>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Input
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Enter workspace ID"
            className="flex-1"
          />
          <Button 
            onClick={checkWorkspace}
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Check Workspace"}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {workspaceInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Valid UUID:</span>
                      <span>{workspaceInfo.diagnostics?.isValidUUID ? "✅ Yes" : "❌ No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workspace Exists:</span>
                      <span>{workspaceInfo.diagnostics?.workspaceExists ? "✅ Yes" : "❌ No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Has Access:</span>
                      <span>{workspaceInfo.diagnostics?.exactMatchInUserWorkspaces || workspaceInfo.diagnostics?.membershipExists ? "✅ Yes" : "❌ No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Workspaces Count:</span>
                      <span>{workspaceInfo.diagnostics?.userWorkspaceCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {workspaceInfo.diagnostics?.workspaceExists && !workspaceInfo.diagnostics?.membershipExists && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fix Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p>This workspace exists but you don&#39;t have membership access.</p>
                      <Button 
                        onClick={fixWorkspaceMembership} 
                        className="w-full"
                      >
                        Fix Workspace Membership
                      </Button>
                      {fixStatus && <p className="text-sm italic">{fixStatus}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {workspaceInfo.userWorkspaces && workspaceInfo.userWorkspaces.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Workspaces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {workspaceInfo.userWorkspaces.map((workspace) => (
                          <tr key={workspace.id}>
                            <td className="px-4 py-2 text-sm">{workspace.id}</td>
                            <td className="px-4 py-2 text-sm">{workspace.name}</td>
                            <td className="px-4 py-2 text-sm">
                              {workspace.userId === workspaceInfo.workspace?.userId ? "Owner" : "Member"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {workspaceInfo.recommendations && workspaceInfo.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {workspaceInfo.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}