// app/(dashboard)/settings/subscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { PlanType, PLAN_FEATURES, PLAN_PRICES } from "@/lib/plans";
import { 
  getCurrentSubscription, 
  createSubscriptionCheckout, 
  cancelSubscription, 
  confirmSubscriptionCheckout 
} from "@/actions/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [planExpires, setPlanExpires] = useState<Date | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const sessionId = searchParams.get("session_id");

  // Fetch current subscription on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const subscription = await getCurrentSubscription();
        setCurrentPlan(subscription.plan as PlanType);
        setPlanExpires(subscription.planExpires);
        setStripeCustomerId(subscription.stripeCustomerId);
        
        // Extract user ID from the URL or session
        // This is a placeholder - you'll need to adjust based on your auth setup
        const session = await fetch('/api/auth/session').then(res => res.json());
        if (session?.user?.id) {
          setUserId(session.user.id);
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

  // Handle checkout session verification when returning from Stripe
  useEffect(() => {
    if (success && sessionId) {
      const verifyCheckout = async () => {
        setIsProcessing(true);
        try {
          await confirmSubscriptionCheckout(sessionId);
          setSuccessMessage("Your subscription has been activated successfully!");
          toast("Subscription Activated");
          
          // Refresh subscription details
          const subscription = await getCurrentSubscription();
          setCurrentPlan(subscription.plan as PlanType);
          setPlanExpires(subscription.planExpires);
          setStripeCustomerId(subscription.stripeCustomerId);
          
          // Clear URL parameters
          router.replace("/settings/subscription");
        } catch (error) {
          console.error("Failed to verify checkout:", error);
          setError("Failed to verify your subscription. Please contact support.");
          toast("Verification Failed");
        } finally {
          setIsProcessing(false);
        }
      };

      verifyCheckout();
    } else if (canceled) {
      setError("You canceled the checkout process. Your subscription was not changed.");
      toast("Checkout Canceled");
      router.replace("/settings/subscription");
    }
  }, [success, sessionId, canceled, router]);

  // Handle subscription changes
  const handleSubscribe = async (plan: PlanType) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (plan === "FREE") {
        await cancelSubscription();
        setSuccessMessage("Your subscription has been downgraded to FREE");
        toast("Subscription Changed");
        setCurrentPlan("FREE");
        setPlanExpires(null);
      } else {
        const result = await createSubscriptionCheckout(plan);
        
        if ('url' in result && result.url) {
          window.location.href = result.url;
          return;
        }
      }
    } catch (error) {
      console.error(`Failed to process ${plan} subscription:`, error);
      setError(`Failed to process your subscription. Please try again.`);
      toast("Subscription Error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle redirect to billing portal
  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      setError("No active subscription to manage.");
      return;
    }

    setIsProcessing(true);
  };

  // Helper to format date
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    if (userId) {
      router.push(`/dashboard/${userId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="default" className="border-green-500 bg-green-50 mb-6">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Plan</p>
              <p className="text-lg font-medium flex items-center">
                {currentPlan}
                {currentPlan !== "FREE" && (
                  <Badge className="ml-2" variant="outline">
                    ${PLAN_PRICES[currentPlan as PlanType]}/month
                  </Badge>
                )}
              </p>
            </div>
            {currentPlan !== "FREE" && (
              <div>
                <p className="text-gray-600">Expires</p>
                <p className="text-lg font-medium">{formatDate(planExpires)}</p>
              </div>
            )}
          </div>
          
          {currentPlan !== "FREE" && stripeCustomerId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Manage Billing Details"}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {(["FREE", "PRO", "BUSINESS"] as PlanType[]).map((plan) => (
          <Card 
            key={plan} 
            className={currentPlan === plan ? "border-2 border-primary shadow-md" : ""}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {plan}
                {currentPlan === plan && <Badge>Current</Badge>}
              </CardTitle>
              <CardDescription className="text-xl font-bold">
                {plan === "FREE" ? "Free" : `$${PLAN_PRICES[plan]}/month`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PLAN_FEATURES[plan].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={isProcessing || currentPlan === plan}
                className="w-full"
                variant={currentPlan === plan ? "outline" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentPlan === plan ? (
                  "Current Plan"
                ) : (
                  `Subscribe to ${plan}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}