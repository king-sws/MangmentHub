/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">User Not Found</h1>
          <p className="mt-4 text-base text-gray-500">
            The user profile you are looking for does not exist or you don't have permission to view it.
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                You might want to check if the URL is correct or return to the dashboard.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}