"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  isCollapsed?: boolean;
}

export function SignOutButton({ isCollapsed = false }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/sign-in",
    });
    router.refresh();
    router.push("/sign-in");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${
        isCollapsed ? "justify-center" : "flex items-center gap-2"
      }`}
    >
      
      {!isCollapsed && <span>Sign out</span>}
    </Button>
  );
}
