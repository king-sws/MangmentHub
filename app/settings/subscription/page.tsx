/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/settings/subscription/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Crown, 
  Zap, 
  Building2, 
  Star, 
  Shield, 
  Clock,
  CreditCard,
  Settings,
  ArrowRight,
  Check,
  X,
  Calendar,
  ExternalLink
} from "lucide-react";
import { PlanType, PLAN_FEATURES, PLAN_PRICES } from "@/lib/plans";
import { 
  getCurrentSubscription, 
  createSubscriptionCheckout, 
  cancelSubscription, 
  confirmSubscriptionCheckout 
} from "@/actions/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Separate component that uses useSearchParams
function SearchParamsHandler({ 
  onSearchParamsChange 
}: { 
  onSearchParamsChange: (params: { success: string | null, canceled: string | null, sessionId: string | null }) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const success = searchParams ? searchParams.get("success") : null;
    const canceled = searchParams ? searchParams.get("canceled") : null;
    const sessionId = searchParams ? searchParams.get("session_id") : null;
    
    onSearchParamsChange({ success, canceled, sessionId });
  }, [searchParams, onSearchParamsChange]);
  
  return null;
}

// Main subscription component
function SubscriptionContent() {
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [planExpires, setPlanExpires] = useState<Date | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchParamsData, setSearchParamsData] = useState<{
    success: string | null;
    canceled: string | null;
    sessionId: string | null;
  }>({ success: null, canceled: null, sessionId: null });
  
  const router = useRouter();

  // Handle search params changes
  const handleSearchParamsChange = (params: { success: string | null, canceled: string | null, sessionId: string | null }) => {
    setSearchParamsData(params);
  };

  // Fetch current subscription on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const subscription = await getCurrentSubscription();
        
        if (subscription) {
          setCurrentPlan(subscription.plan as PlanType);
          setPlanExpires(subscription.planExpires ? new Date(subscription.planExpires) : null);
          setStripeCustomerId(subscription.stripeCustomerId);
          
          try {
            const res = await fetch("/api/auth/session");
            const session = await res.json();
            if (session?.user?.id) {
              setUserId(session.user.id);
            }
          } catch (error) {
            console.warn("Session fetch failed, continuing without user ID");
          }
        } else {
          setCurrentPlan("FREE");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
        setError("Failed to load subscription details");
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  // Handle checkout session verification
  useEffect(() => {
    const { success, sessionId, canceled } = searchParamsData;
    
    if (success && sessionId) {
      const verifyCheckout = async () => {
        setProcessingPlan(null);
        try {
          await confirmSubscriptionCheckout(sessionId);
          setSuccessMessage("Your subscription has been activated successfully!");
          toast("Subscription Activated", {
            description: "Welcome to your new plan!",
            duration: 5000,
          });
          
          const subscription = await getCurrentSubscription();
          if (subscription) {
            setCurrentPlan(subscription.plan as PlanType);
            setPlanExpires(subscription.planExpires ? new Date(subscription.planExpires) : null);
            setStripeCustomerId(subscription.stripeCustomerId);
          }
          
          router.replace("/settings/subscription", { scroll: false });
        } catch (error) {
          console.error("Failed to verify checkout:", error);
          setError("Failed to verify your subscription. Please contact support.");
          toast("Verification Failed", {
            description: "Please contact support if this issue persists.",
          });
        }
      };

      verifyCheckout();
    } else if (canceled) {
      setError("You canceled the checkout process. Your subscription was not changed.");
      toast("Checkout Canceled", {
        description: "Your subscription remains unchanged.",
      });
      router.replace("/settings/subscription", { scroll: false });
    }
  }, [searchParamsData, router]);

  // Handle subscription changes
  const handleSubscribe = async (plan: PlanType) => {
    setProcessingPlan(plan);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (plan === "FREE") {
        await cancelSubscription();
        setSuccessMessage("Your subscription has been downgraded to FREE");
        toast("Subscription Changed", {
          description: "You've been moved to the free plan.",
        });
        setCurrentPlan("FREE");
        setPlanExpires(null);
      } else {
        const result = await createSubscriptionCheckout(plan);
        
        if (result && 'url' in result && result.url) {
          window.location.href = result.url;
          return;
        } else {
          throw new Error("Invalid checkout response");
        }
      }
    } catch (error) {
      console.error(`Failed to process ${plan} subscription:`, error);
      setError(`Failed to process your subscription. Please try again.`);
      toast("Subscription Error", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  // Handle billing portal
  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      setError("No active subscription to manage.");
      return;
    }

    setProcessingPlan("MANAGE" as PlanType);
    setTimeout(() => setProcessingPlan(null), 2000);
  };

  // Helper functions
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleBackToDashboard = () => {
    if (userId) {
      router.push(`/dashboard/${userId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400 text-center">Loading subscription details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(planExpires);

  return (
    <>
      {/* Search params handler */}
      <SearchParamsHandler onSearchParamsChange={handleSearchParamsChange} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Subscription & Billing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Manage your subscription and billing settings
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 w-full sm:w-auto justify-center sm:justify-start"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6 sm:mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert className="mb-6 sm:mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Current Plan Status */}
          {currentPlan && (
            <Card className="mb-8 sm:mb-10 border-0 shadow-sm bg-white dark:bg-neutral-900/50 backdrop-blur">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/30 flex-shrink-0">
                      {currentPlan === "FREE" && <Star className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />}
                      {currentPlan === "PRO" && <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />}
                      {currentPlan === "BUSINESS" && <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          {currentPlan} Plan
                        </h3>
                        {currentPlan !== "FREE" && (
                          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
                            ${PLAN_PRICES[currentPlan]}/month
                          </Badge>
                        )}
                        {currentPlan === "FREE" && (
                          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 w-fit">
                            Free
                          </Badge>
                        )}
                      </div>
                      {planExpires && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {daysRemaining !== null && daysRemaining > 0 
                                ? `Next billing: ${formatDate(planExpires)}`
                                : `Expired: ${formatDate(planExpires)}`
                              }
                            </span>
                          </div>
                          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/20 w-fit">
                              Renews in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {stripeCustomerId && (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={processingPlan === "MANAGE"}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-800 w-full lg:w-auto justify-center"
                    >
                      {processingPlan === "MANAGE" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Manage Billing
                          <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {(["FREE", "PRO", "BUSINESS"] as PlanType[]).map((plan) => {
              const isCurrentPlan = currentPlan === plan;
              const isProcessing = processingPlan === plan;
              const isPro = plan === "PRO";
              
              return (
                <Card 
                  key={plan} 
                  className={`relative transition-all duration-200 hover:shadow-lg ${
                    isCurrentPlan 
                      ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/10 shadow-lg' 
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900/50 hover:border-gray-300 dark:hover:border-gray-700'
                  } ${
                    isPro 
                      ? 'border-blue-200 dark:border-blue-800 shadow-md' 
                      : ''
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-1.5 shadow-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8">
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center ${
                        plan === "FREE" ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" :
                        plan === "PRO" ? "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30" :
                        "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30"
                      }`}>
                        {plan === "FREE" && <Star className="h-7 w-7 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-400" />}
                        {plan === "PRO" && <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />}
                        {plan === "BUSINESS" && <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />}
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{plan}</CardTitle>
                    
                    <div className="mt-3 sm:mt-4">
                      {plan === "FREE" ? (
                        <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                          Free
                        </div>
                      ) : (
                        <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                          ${PLAN_PRICES[plan]}
                          <span className="text-base sm:text-lg font-normal text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 pb-6 sm:pb-8">
                    <ul className="space-y-3 sm:space-y-4">
                      {PLAN_FEATURES[plan].map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-6 sm:pb-8">
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isProcessing || (isCurrentPlan && plan !== "FREE")}
                      className={`w-full h-11 sm:h-12 font-semibold transition-all ${
                        isCurrentPlan && plan !== "FREE"
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          : isPro && !isCurrentPlan
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
                          : plan === "BUSINESS" && !isCurrentPlan
                          ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                          : ""
                      }`}
                      variant={
                        (isPro && !isCurrentPlan) || (plan === "BUSINESS" && !isCurrentPlan) 
                          ? "default" 
                          : "outline"
                      }
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan && plan !== "FREE" ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Current Plan
                        </>
                      ) : plan === "FREE" && currentPlan !== "FREE" ? (
                        "Downgrade to Free"
                      ) : plan === "FREE" && currentPlan === "FREE" ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          Upgrade to {plan}
                          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="mt-12 sm:mt-16 text-center space-y-6">
            <div className="max-w-2xl mx-auto px-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Need help choosing the right plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our support team is available to help you find the perfect plan for your needs. 
                Get in touch and we'll guide you through the options.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="outline" className="flex items-center gap-2 px-6 py-2.5 font-medium w-full sm:w-auto">
                <Settings className="h-4 w-4" />
                Contact Support
              </Button>
              <span className="text-gray-400 dark:text-gray-600 hidden sm:block">•</span>
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 w-full sm:w-auto">
                View FAQ
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main export with Suspense wrapper
export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400 text-center">Loading subscription details...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}