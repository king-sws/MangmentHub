'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWorkspace } from '@/actions/workspace';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    
    if (!session?.user?.id) {
      toast.error('You must be signed in to create a workspace');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const workspace = await createWorkspace({
        name: name.trim(),
        userId: session.user.id,
      });
      
      toast.success("Your workspace has been created");
      
      // Force a cache invalidation
      router.refresh();
      
      // Navigate to the new workspace
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Create a workspace to organize your boards and collaborate with team members
        </p>
      </div>
      
      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Workspace Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Workspace"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your workspace
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="mr-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}