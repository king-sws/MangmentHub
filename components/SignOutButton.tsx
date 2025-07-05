"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  isCollapsed?: boolean;
}

export function SignOutButton({ isCollapsed = false }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Sign out with redirect to sign-in page
      await signOut({
        redirect: false,
        callbackUrl: "/sign-in",
      });
      
      // Refresh router state and redirect
      router.refresh();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300 ${
        isCollapsed ? "justify-center" : "flex items-center gap-2"
      }`}
    >
      <LogOut className="h-4 w-4" />
      {!isCollapsed && <span>Sign out</span>}
    </Button>
  );
}