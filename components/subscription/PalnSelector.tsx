// components/subscription/PlanSelector.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanType, PLAN_FEATURES, PLAN_PRICES } from '@/lib/plans';
import StripeCheckout from './StripeCheckout';

interface PlanSelectorProps {
  currentPlan: PlanType;
}

export default function PlanSelector({ currentPlan }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      router.refresh();
    }, 3000);
  };

  const plans: PlanType[] = ['FREE', 'PRO', 'BUSINESS'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
      
      {showSuccessMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          Subscription updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan}
            className={`border rounded-lg p-4 cursor-pointer transition ${
              selectedPlan === plan 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{plan}</h3>
              {currentPlan === plan && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Current
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <span className="text-2xl font-bold">
                ${PLAN_PRICES[plan]}
              </span>
              {plan !== 'FREE' && <span className="text-gray-500">/month</span>}
            </div>
            
            <ul className="mb-4 space-y-2">
              {PLAN_FEATURES[plan].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            {selectedPlan === plan && currentPlan !== plan && (
              <StripeCheckout 
                plan={plan} 
                onSuccess={handleSuccess}
              />
            )}
          </div>
        ))}
      </div>

      {currentPlan !== 'FREE' && (
        <div className="mt-6">
          <button
            onClick={async () => {
              const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
              });
              
              if (response.ok) {
                const { url } = await response.json();
                window.location.href = url;
              }
            }}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            Manage Subscription in Stripe
          </button>
        </div>
      )}
    </div>
  );
}