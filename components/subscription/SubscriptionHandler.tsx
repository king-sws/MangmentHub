"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createSubscriptionCheckout } from '@/actions/subscription';
import { PlanType } from '@/lib/plans';
import { toast } from 'sonner';

interface SubscriptionHandlerProps {
  plan: PlanType;
  currentPlan: PlanType;
  children: React.ReactNode;
}

export function SubscriptionHandler({ plan, currentPlan, children }: SubscriptionHandlerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Handle plan selection
  const handlePlanSelect = async () => {
    try {
      setLoading(true);
      
      // If selecting the same plan, do nothing
      if (plan === currentPlan) {
        toast( `You are already on the ${plan} plan.`);
        return;
      }
      
      // Create subscription checkout
      const result = await createSubscriptionCheckout(plan);
      
      if (result.success && plan === 'FREE') {
        // For FREE plan, no Stripe checkout needed
        toast("Subscription Updated");
        
        // Force a full refresh of the page to update the sidebar
        router.refresh();
        
        // Wait a moment to ensure server state is updated, then force-reload client state
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } else if ('url' in result && result.url) {
        // For paid plans, redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast("Error");
    } finally {
      setLoading(false);
    }
  };

  // Check for Stripe return status in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const stripeSuccess = queryParams.get('stripe-success');
    
    if (stripeSuccess === 'true') {
      // Success from Stripe payment
      toast("Subscription Updated");
      
      // Remove query param to prevent duplicate toasts
      router.replace('/settings/subscription', { scroll: false });
      
      // Force a full refresh to update the sidebar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [router, plan]);

  return (
    <Button 
      onClick={handlePlanSelect} 
      disabled={loading || plan === currentPlan}
      className="w-full"
    >
      {loading ? "Processing..." : children}
    </Button>
  );
}