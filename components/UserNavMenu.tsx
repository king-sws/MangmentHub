"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function UserNavMenu({ user }: { user: User }) {
  const router = useRouter();
  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`;
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/sign-in");
  };
  
  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <div className="relative h-8 w-8 rounded-full overflow-hidden">
            <Image 
              src={avatarUrl}
              alt={user.name || "User"} 
              fill
              className="object-cover"
            />
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm">Signed in as</p>
            <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          
          <hr className="border-gray-200" />
          
          <Menu.Item>
            {({ active }) => (
              <Link
                href={`/dashboard/${user.id}/profile`}
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block px-4 py-2 text-sm text-gray-700"
                )}
              >
                Your Profile
              </Link>
            )}
          </Menu.Item>
          
          <Menu.Item>
            {({ active }) => (
              <Link
                href={`/dashboard/${user.id}/settings`}
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block px-4 py-2 text-sm text-gray-700"
                )}
              >
                Settings
              </Link>
            )}
          </Menu.Item>
          
          <hr className="border-gray-200" />
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleSignOut}
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block w-full text-left px-4 py-2 text-sm text-gray-700"
                )}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}