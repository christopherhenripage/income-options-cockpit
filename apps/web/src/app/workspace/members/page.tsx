'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
type InviteStatus = 'pending' | 'accepted' | 'expired';

interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
  lastActive: string | null;
}

interface WorkspaceInvite {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  invitedAt: string;
  expiresAt: string;
  invitedBy: string;
}

// Mock data
const mockMembers: WorkspaceMember[] = [
  {
    id: '1',
    email: 'you@example.com',
    name: 'You',
    role: 'owner',
    joinedAt: '2026-01-01T00:00:00Z',
    lastActive: '2026-01-18T14:30:00Z',
  },
  {
    id: '2',
    email: 'mike.t@example.com',
    name: 'Mike T.',
    role: 'member',
    joinedAt: '2026-01-05T00:00:00Z',
    lastActive: '2026-01-18T10:00:00Z',
  },
];

const mockInvites: WorkspaceInvite[] = [
  {
    id: '1',
    email: 'newuser@example.com',
    role: 'viewer',
    status: 'pending',
    invitedAt: '2026-01-17T00:00:00Z',
    expiresAt: '2026-01-24T00:00:00Z',
    invitedBy: 'You',
  },
];

export default function WorkspaceMembersPage() {
  const [members] = useState<WorkspaceMember[]>(mockMembers);
  const [invites, setInvites] = useState<WorkspaceInvite[]>(mockInvites);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getRoleBadge = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return (
          <Badge variant="default" className="gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="gap-1 text-blue-400 border-blue-500/50">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'member':
        return (
          <Badge variant="outline" className="gap-1">
            Member
          </Badge>
        );
      case 'viewer':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            Viewer
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: InviteStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setLoading(true);

    // Mock invite - in real implementation, this would call the API
    const newInvite: WorkspaceInvite = {
      id: `invite-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'You',
    };

    setInvites([newInvite, ...invites]);
    setInviteEmail('');
    setInviteRole('viewer');
    setInviteDialogOpen(false);
    setLoading(false);
  };

  const handleCancelInvite = (inviteId: string) => {
    setInvites(invites.filter((i) => i.id !== inviteId));
  };

  const handleResendInvite = (inviteId: string) => {
    // Mock resend - in real implementation, this would call the API
    setInvites(
      invites.map((i) =>
        i.id === inviteId
          ? {
              ...i,
              invitedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : i
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Workspace Members"
        subtitle="Manage who has access to your workspace"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Info Banner */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Users className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-400 mb-1">
                  Workspace Collaboration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share your workspace with team members or trusted partners to
                  collaborate on trade ideas. Members can view trade recommendations,
                  add comments, and share insights. Each member has their own login
                  but shares the same workspace data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions</CardTitle>
            <CardDescription>
              Understanding what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">Owner</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full control</li>
                  <li>• Delete workspace</li>
                  <li>• Transfer ownership</li>
                  <li>• Manage billing</li>
                </ul>
              </div>

              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">Admin</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Manage members</li>
                  <li>• Edit settings</li>
                  <li>• Run recomputes</li>
                  <li>• Manage trades</li>
                </ul>
              </div>

              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Member</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View trades</li>
                  <li>• Add comments</li>
                  <li>• Paper trading</li>
                  <li>• Journal entries</li>
                </ul>
              </div>

              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Viewer</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View trades</li>
                  <li>• View comments</li>
                  <li>• Read-only access</li>
                  <li>• No modifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
                </CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your workspace. They&apos;ll receive an
                      email with a link to sign up or sign in.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value as MemberRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                      {member.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        {getRoleBadge(member.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Last active</p>
                      <p>
                        {member.lastActive
                          ? formatDateTime(member.lastActive)
                          : 'Never'}
                      </p>
                    </div>
                    {member.role !== 'owner' && (
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="glass-panel p-4 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invite.email}</span>
                          {getRoleBadge(invite.role)}
                          {getStatusBadge(invite.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invite.invitedBy} •{' '}
                          Expires {formatDateTime(invite.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-500"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg">
              <div>
                <p className="font-medium">Leave Workspace</p>
                <p className="text-sm text-muted-foreground">
                  Remove yourself from this workspace. This cannot be undone.
                </p>
              </div>
              <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                Leave Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
