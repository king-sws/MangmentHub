import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TasksHeader } from "./_components/TasksHeader";
import { TasksTable } from "./_components/TasksTable";


export default async function TasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <TasksHeader />
      <Suspense fallback={<div className="flex items-center justify-center py-10">Loading tasks...</div>}>
        <TasksTable userId={session.user.id} />
      </Suspense>
    </div>
  );
}