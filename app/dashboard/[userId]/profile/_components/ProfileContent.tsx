"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Define the User type
type Workspace = {
  id: string;
  name: string;
  _count: {
    boards: number;
  };
};

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  provider: string;
  workspaces: Workspace[];
};

type ProfileContentProps = {
  user: ProfileUser;
  canViewFullProfile: boolean;
};

export function ProfileContent({ user, canViewFullProfile }: ProfileContentProps) {
  // Default avatar if no image is provided
  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`;
  
  // Format the date when the email was verified
  const formattedVerificationDate = user.emailVerified 
    ? formatDistanceToNow(new Date(user.emailVerified), { addSuffix: true })
    : "Not verified";
  
  // Capitalize the first letter of the provider
  const providerName = user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image 
              src={avatarUrl}
              alt={user.name || "User"} 
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">
              {user.name || "Anonymous User"}
            </h2>
            <p className="text-blue-100 font-medium">
              {user.role === "ADMIN" ? "Administrator" : "User"}
            </p>
          </div>
          
          {canViewFullProfile && (
            <div className="ml-auto mt-4 sm:mt-0">
              <Link 
                href={`/dashboard/${user.id}/settings`} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="p-6">
        {/* User Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name || "Not provided"}</dd>
            </div>
            
            {canViewFullProfile && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
            )}
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Account type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {providerName}
                </span>
              </dd>
            </div>
            
            {canViewFullProfile && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                <dd className="mt-1 text-sm text-gray-900">{formattedVerificationDate}</dd>
              </div>
            )}
          </dl>
        </div>
        
        {/* Workspaces Section (Only visible to the user themselves) */}
        {canViewFullProfile && user.workspaces.length > 0 && (
          <div className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Workspaces</h3>
            
            <ul className="divide-y divide-gray-200">
              {user.workspaces.map((workspace) => (
                <li key={workspace.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/dashboard/workspaces/${workspace.id}`} 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {workspace.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {workspace._count.boards} {workspace._count.boards === 1 ? 'board' : 'boards'}
                      </p>
                    </div>
                    <div>
                      <Link 
                        href={`/dashboard/workspaces/${workspace.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="mt-4">
              <Link 
                href="/dashboard/workspaces" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                View all workspaces →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}