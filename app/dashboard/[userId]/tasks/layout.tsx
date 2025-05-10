// app/dashboard/[userId]/tasks/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TasksLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Optional: Verify that the user can only access their own dashboard
  if (session.user.id !== params.userId) {
    redirect(`/dashboard/${session.user.id}/tasks`);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {children}
    </div>
  );
}