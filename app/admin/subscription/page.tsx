/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/subscription/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSubscriptionPage() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PRO" | "BUSINESS">("FREE");
  const [adminKey, setAdminKey] = useState("");
  const [action, setAction] = useState<"update" | "sync">("sync");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          plan,
          action,
          adminKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update subscription');
      }
      
      setResult(data);
      
      // Refresh user details after update
      if (userId) {
        fetchUserDetails();
      }
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    if (!userId || !adminKey) {
      setError("User ID and Admin Key are required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/subscription?userId=${userId}&adminKey=${adminKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch user details');
      }
      
      setUserDetails(data.user);
      
    } catch (err) {
      setError((err as Error).message);
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Subscription Admin Tool</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Warning:</strong> This tool is for administrators only. Changes made here will directly affect users' subscriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin API Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as "update" | "sync")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="sync">Sync Current Plan</option>
                  <option value="update">Update Plan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as "FREE" | "PRO" | "BUSINESS")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={action === "sync"}
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Processing...' : action === 'update' ? 'Update Plan' : 'Sync Subscription'}
              </button>
              
              <button
                type="button"
                onClick={fetchUserDetails}
                disabled={loading || !userId || !adminKey}
                className={`px-4 py-2 rounded-md font-medium ${
                  loading || !userId || !adminKey
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Check User
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {result && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
              <p><strong>Success:</strong> {result.result?.message}</p>
              {result.result?.subscriptionId && (
                <p className="text-sm mt-1">Subscription ID: {result.result.subscriptionId}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>
          
          {userDetails ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name / Email</p>
                <p>{userDetails.name} / {userDetails.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="font-medium">{userDetails.plan}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Plan Expires</p>
                <p>{userDetails.planExpires 
                  ? new Date(userDetails.planExpires).toLocaleString() 
                  : 'Never (Free Plan)'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Plan Started</p>
                <p>{userDetails.planStarted 
                  ? new Date(userDetails.planStarted).toLocaleString() 
                  : 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p>{userDetails.planUpdated 
                  ? new Date(userDetails.planUpdated).toLocaleString() 
                  : 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Stripe Customer ID</p>
                <p className="text-sm font-mono">{userDetails.stripeCustomerId || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Stripe Subscription ID</p>
                <p className="text-sm font-mono">{userDetails.stripeSubscriptionId || 'Not set'}</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 italic">
              Enter a user ID and click "Check User" to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}