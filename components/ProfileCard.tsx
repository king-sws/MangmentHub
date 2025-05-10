"use client";

import Image from "next/image";
import Link from "next/link";

type ProfileCardProps = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  showEmail?: boolean;
};

export function ProfileCard({ user, showEmail = false }: ProfileCardProps) {
  // Default avatar if no image is provided
  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center">
          <div className="relative h-12 w-12 rounded-full overflow-hidden">
            <Image 
              src={avatarUrl}
              alt={user.name || "User"} 
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {user.name || "Anonymous User"}
            </h3>
            {showEmail && user.email && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Link
            href={`/dashboard/${user.id}/profile`}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}