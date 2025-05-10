// app/(auth)/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setTimeout(() => {
        router.replace(`/dashboard/${session.user.id}`);
      }, 100);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return status === "unauthenticated" ? (
    <div className="min-h-screen bg-muted">{children}</div>
  ) : null;
}
