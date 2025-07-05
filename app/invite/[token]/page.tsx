/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSafeSearchParams from '@/hooks/useSafeSearchParams';
import { Loader2, Mail, UserPlus, Shield, Users, CheckCircle, ArrowRight, Building2, Sparkles, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInWithCredentials, SignUpWithCredentials } from "@/actions/action";
import { toast } from "sonner";
import Image from "next/image";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    workspace: string;
    isValid: boolean;
    error?: string;
    memberInfo?: {
      currentCount: number;
      limit: number;
      canJoin: boolean;
      plan: string;
    };
  } | null>(null);

  const router = useRouter();
  const searchParams = useSafeSearchParams();

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
            email: data.invitation.email,
            workspace: data.workspace.name,
            isValid: true,
            memberInfo: data.memberInfo
          });
          setEmail(data.invitation.email);
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
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 flex justify-center items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-blue-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-blue-100/25 to-indigo-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-indigo-200 dark:border-indigo-900 animate-pulse mx-auto"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo?.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 flex justify-center items-center p-4">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-blue-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-blue-100/25 to-indigo-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
        </div>

        <Card className="relative z-10 w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {inviteInfo?.error || "This invitation is invalid or has expired."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 dark:from-indigo-500 dark:to-blue-600 dark:hover:from-indigo-600 dark:hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glowing blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-blue-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-blue-100/25 to-indigo-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-blue-300/15 dark:from-indigo-600/10 dark:to-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Glowing top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-500 to-transparent shadow-lg" />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-lg mx-auto lg:mx-0">
            {/* Logo/Brand */}
            <div className="relative mb-10">
              <Image
                src="/blutto-no.svg"
                alt="Blutto Logo"
                width={100}
                height={100}
                className="dark:hidden" // Hide in dark mode
              />
              <Image
                src="/blutto-white-no.svg" 
                alt="Blutto Logo" 
                width={100} 
                height={100}
                className="hidden dark:block" // Show only in dark mode
              />
              </div>

            {/* Invitation Header */}
            <div className="mb-8">
              <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
                Workspace Invitation
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Join <span className="bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">{inviteInfo.workspace}</span>
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                You've been invited to collaborate and grow together in a powerful workspace environment designed for enterprise teams.
              </p>
            </div>

            {/* Member Info */}
            {inviteInfo.memberInfo && (
              <div className="mb-8 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    {inviteInfo.memberInfo.plan.toUpperCase()} Plan
                  </span>
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Members: {inviteInfo.memberInfo.currentCount}/{inviteInfo.memberInfo.limit}
                </p>
                {!inviteInfo.memberInfo.canJoin && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    ⚠️ Member limit reached - Contact workspace owner to upgrade
                  </p>
                )}
              </div>
            )}

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Enterprise-Grade Security</h3>
                  <p className="text-gray-600 dark:text-gray-400">Your data is protected with industry-leading security protocols</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Collaboration</h3>
                  <p className="text-gray-600 dark:text-gray-400">Work together seamlessly with your team members</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Intuitive Interface</h3>
                  <p className="text-gray-600 dark:text-gray-400">Experience unparalleled efficiency with our platform</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">10K+</div>
                <div className="text-gray-600 dark:text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">89.9%</div>
                <div className="text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="lg:w-1/2 flex justify-center items-center p-8 lg:p-16">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to {inviteInfo.workspace}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                  Complete your account setup to get started
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Invitation Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:bg-gradient-to-br dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Invitation Details</span>
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Email: <span className="font-mono">{inviteInfo.email}</span>
                </p>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Workspace: <span className="font-semibold">{inviteInfo.workspace}</span>
                </p>
              </div>

              <Tabs defaultValue={(searchParams?.get("tab")) || "signin"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input 
                        id="signin-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!inviteInfo.email}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <Input 
                        id="signin-password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 dark:from-indigo-500 dark:to-blue-600 dark:hover:from-indigo-600 dark:hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
                      disabled={formLoading || (inviteInfo.memberInfo && !inviteInfo.memberInfo.canJoin)}
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Sign In & Join Workspace
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </Label>
                      <Input 
                        id="signup-name" 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!inviteInfo.email}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <Input 
                        id="signup-password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                        placeholder="Create a secure password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 dark:from-indigo-500 dark:to-blue-600 dark:hover:from-indigo-600 dark:hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
                      disabled={formLoading || (inviteInfo.memberInfo && !inviteInfo.memberInfo.canJoin)}
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account & Join
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Warning for member limit */}
              {inviteInfo.memberInfo && !inviteInfo.memberInfo.canJoin && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-900 dark:text-red-300">Member Limit Reached</span>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This workspace has reached its member limit. Please contact the workspace owner to upgrade their plan.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="text-center pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}