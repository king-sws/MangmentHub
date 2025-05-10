'use client';

// app/dashboard/create-workspace/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWorkspace } from '@/actions/workspace';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast('Workspace name is required');
      return;
    }
    
    if (!session?.user?.id) {
      toast('You must be signed in to create a workspace');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Creating workspace:', name, 'for user:', session.user.id);
      const workspace = await createWorkspace({
        name: name.trim(),
        userId: session.user.id,
      });
      
      console.log('Workspace created:', workspace);
      
      toast("Your workspace has been created");
      
      // Force a cache invalidation
      router.refresh(); 
      
      // IMPORTANT: Navigate to the workspace route instead of dashboard
      setTimeout(() => {
        router.push(`/workspace/${workspace.id}`);
      }, 100);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Workspace</h1>
      
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
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="mr-2"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </div>
  );
}