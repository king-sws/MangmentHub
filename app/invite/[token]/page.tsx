/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInWithCredentials, SignUpWithCredentials } from "@/actions/action";
import { toast } from "sonner";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    workspace: string;
    isValid: boolean;
    error?: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    async function fetchInviteInfo() {
      try {
        const res = await fetch(`/api/invitations/${params.token}`);
        const data = await res.json();

        if (res.ok) {
          setInviteInfo({
            email: data.email,
            workspace: data.workspaceName,
            isValid: true
          });
          setEmail(data.email);
        } else {
          setInviteInfo({
            email: "",
            workspace: "",
            isValid: false,
            error: data.error || "This invitation is invalid or has expired"
          });
        }
      } catch (error) {
        setInviteInfo({
          email: "",
          workspace: "",
          isValid: false,
          error: "Failed to load invitation details"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInviteInfo();
  }, [params.token]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const result = await SignInWithCredentials(email, password, params.token);
      
      if (result.success) {
        toast.success("Signed in successfully");
        
        if (result.inviteProcessed === false) {
          toast.error(result.error || "Could not process invitation");
        }
        
        // Redirect to workspace or dashboard
        if (result.workspaceId) {
          router.push(`/workspace/${result.workspaceId}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(result.error || "Sign in failed");
      }
    } catch (error) {
      toast.error("An error occurred during sign in");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }
    
    setFormLoading(true);

    try {
      const result = await SignUpWithCredentials(name, email, password, params.token);
      
      if (result.success) {
        toast.success("Account created successfully");
        
        if (result.inviteProcessed === false) {
          toast.error("Could not process invitation");
        }
        
        // Redirect to workspace or dashboard
        if (result.workspaceId) {
          router.push(`/workspace/${result.workspaceId}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(result.error || "Sign up failed");
      }
    } catch (error) {
      toast.error("An error occurred during sign up");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!inviteInfo?.isValid) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{inviteInfo?.error || "This invitation is invalid or has expired."}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join {inviteInfo.workspace}</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join {inviteInfo.workspace}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={(searchParams?.get("tab")) || "sign-in"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!inviteInfo.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input 
                    id="signin-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Sign In & Accept Invitation
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!inviteInfo.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Sign Up & Accept Invitation
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}