// app/dashboard/[userId]/settings/subscription/page.tsx
import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlanType, getEffectivePlan, isPlanActive } from '@/lib/plans';
import { format } from 'date-fns';
import PlanSelector from '@/components/subscription/PalnSelector';

async function SubscriptionDetails({ params }: { params: { userId: string } }) {
  const session = await auth();
  
  // Check if user is authorized to view this page
  if (!session?.user?.id || session.user.id !== params.userId) {
    redirect('/sign-in');
  }
  
  // Get user with subscription details
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      name: true,
      email: true,
      plan: true,
      planExpires: true,
      planStarted: true,
      planUpdated: true,
    },
  });
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
  const isActive = isPlanActive(user.planExpires);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Settings</h1>
        <p className="text-gray-600">Manage your subscription plan</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium">{user.plan}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            {user.plan !== 'FREE' && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Current Effective Plan</p>
                <p className="font-medium">{effectivePlan}</p>
              </div>
            )}
          </div>
          
          <div>
            {user.planStarted && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Subscription Started</p>
                <p className="font-medium">{format(user.planStarted, 'MMM d, yyyy')}</p>
              </div>
            )}
            
            {user.planExpires && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Subscription Expires</p>
                <p className="font-medium">{format(user.planExpires, 'MMM d, yyyy')}</p>
              </div>
            )}
            
            {user.planUpdated && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{format(user.planUpdated, 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <PlanSelector currentPlan={user.plan as PlanType} />
    </div>
  );
}

export default function SubscriptionPage({ params }: { params: { userId: string } }) {
  return (
    <div className="p-6">
      <Suspense fallback={<div>Loading subscription details...</div>}>
        <SubscriptionDetails params={params} />
      </Suspense>
    </div>
  );
}