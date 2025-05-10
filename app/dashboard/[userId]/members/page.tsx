/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, UserPlus, Trash2, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WorkspaceMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export default function MembersPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Fetch current user's role
        const roleResponse = await fetch(`/api/workspaces/${workspaceId}/role`)
        const roleData = await roleResponse.json()
        
        if (roleResponse.ok) {
          setUserRole(roleData.role)
        }
        
        // Fetch members
        const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members`)
        const membersData = await membersResponse.json()
        
        if (membersResponse.ok) {
          setMembers(membersData)
        } else {
          setError('Failed to fetch members')
        }
      } catch (err) {
        setError('An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMembers()
  }, [workspaceId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }
      
      setSuccess('Invitation sent successfully')
      setEmail('')
      setInviteRole('MEMBER')
      setTimeout(() => setOpen(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove member')
      }
      
      setMembers(members.filter(member => member.user.id !== memberId))
    } catch (err) {
      setError('Failed to remove member')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update role')
      }
      
      setMembers(members.map(member => 
        member.user.id === memberId 
          ? { ...member, role: newRole as 'ADMIN' | 'MEMBER' } 
          : member
      ))
    } catch (err) {
      setError('Failed to update role')
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workspace Members</h1>
        {(userRole === 'OWNER' || userRole === 'ADMIN') && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRole === 'OWNER' && (
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        )}
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {success && <p className="text-sm text-green-500">{success}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage the members of your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No members found</p>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-full p-2">
                      {member.role === "OWNER" ? (
                        <Shield className="h-5 w-5 text-yellow-600" />
                      ) : member.role === "ADMIN" ? (
                        <Shield className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.user.name}</div>
                      <div className="text-sm text-gray-500">{member.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.role !== "OWNER" && userRole === "OWNER" && (
                      <Select 
                        defaultValue={member.role}
                        onValueChange={(value) => handleRoleChange(member.user.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {member.role !== "OWNER" && 
                     (userRole === "OWNER" || (userRole === "ADMIN" && member.role === "MEMBER")) && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}