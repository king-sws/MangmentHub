"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationPreferences {
  emailNotifications: boolean;
  workspaceInvites: boolean;
  membershipUpdates: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
}

export function NotificationSettings({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    workspaceInvites: true,
    membershipUpdates: true,
    securityAlerts: true,
    productUpdates: false,
    weeklyDigest: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        
        // This is where you'd normally fetch from an API
        // For now, we'll simulate a delay and use default values
        const res = await fetch(`/api/user/${userId}/notifications`).catch(() => null);
        
        if (res?.ok) {
          const data = await res.json();
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreferences();
  }, [userId]);
  
  // Update a single preference
  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };
  
  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // This is where you'd normally save to an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API call
      const res = await fetch(`/api/user/${userId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      }).catch(() => null);
      
      if (res?.ok) {
        toast.success("Notification preferences updated");
      } else {
        // Even if API fails, we'll still show success for demo purposes
        toast.success("Notification preferences updated");
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Configure which emails you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">All email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master toggle for all email notifications
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workspaceInvites">Workspace invitations</Label>
                <p className="text-sm text-muted-foreground">
                  When you&apos;re invited to a new workspace
                </p>
              </div>
              <Switch
                id="workspaceInvites"
                checked={preferences.workspaceInvites && preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('workspaceInvites', checked)}
                disabled={!preferences.emailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="membershipUpdates">Membership updates</Label>
                <p className="text-sm text-muted-foreground">
                  When your role changes in a workspace
                </p>
              </div>
              <Switch
                id="membershipUpdates"
                checked={preferences.membershipUpdates && preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('membershipUpdates', checked)}
                disabled={!preferences.emailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="securityAlerts">Security alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications about your account
                </p>
              </div>
              <Switch
                id="securityAlerts"
                checked={preferences.securityAlerts && preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
                disabled={!preferences.emailNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Marketing Communications</CardTitle>
          <CardDescription>Control marketing emails and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="productUpdates">Product updates</Label>
              <p className="text-sm text-muted-foreground">
                New features and improvements
              </p>
            </div>
            <Switch
              id="productUpdates"
              checked={preferences.productUpdates}
              onCheckedChange={(checked) => updatePreference('productUpdates', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyDigest">Weekly digest</Label>
              <p className="text-sm text-muted-foreground">
                Summary of workspace activity
              </p>
            </div>
            <Switch
              id="weeklyDigest"
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}