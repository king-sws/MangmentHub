"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { PlanType, getPlanPrice } from '@/lib/plans';

// Initialize Stripe - replace with your actual publishable key from environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
  plan: PlanType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function StripeCheckout({ plan, onSuccess, onCancel }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const price = getPlanPrice(plan);

  const handleSubscribe = async () => {
    if (plan === 'FREE') {
      // Handle free plan subscription without payment
      try {
        setIsLoading(true);
        const response = await fetch('/api/subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan }),
        });
        if (response.ok) {
          router.refresh();
          onSuccess?.();
        } else {
          const error = await response.json();
          console.error('Subscription error:', error);
        }
      } catch (error) {
        console.error('Failed to update subscription:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (error) {
        console.error('Stripe checkout error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`mt-4 px-4 py-2 rounded-lg font-medium transition ${
        isLoading ? 'bg-gray-300 cursor-not-allowed' : plan === 'FREE'
          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isLoading
        ? 'Processing...'
        : plan === 'FREE'
          ? 'Switch to Free Plan'
          : `Subscribe for $${price.toFixed(2)}/month`}
    </button>
  );
}