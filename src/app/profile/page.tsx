'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Shield, KeyRound, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateAdminServerAction } from '../../lib/server-actions/admin';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Admin');
  const userRole = user?.role || 'Administrator';
  const fallbackInitials = displayName.substring(0, 2).toUpperCase();
  const adminId = user?.id ? `AD_${user.id.slice(-6).toUpperCase()}` : 'N/A';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingDetails, setSavingDetails] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Role is deliberately not editable here — PATCH /admin/{id} accepts a role, but letting an
  // admin grant themselves a higher one from their own profile page is a privilege-escalation
  // hole, not a feature. Role changes belong on an admin-management screen with its own
  // authorization, not self-service.

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Missing admin ID — please log out and log back in.');
      return;
    }
    const payload: { name?: string; email?: string } = {};
    if (name.trim() && name.trim() !== user.name) payload.name = name.trim();
    if (email.trim() && email.trim() !== user.email) payload.email = email.trim();
    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to update.');
      return;
    }
    setSavingDetails(true);
    try {
      const res = await updateAdminServerAction(user.id, payload);
      if (res.ok) {
        updateUser({ name: res.data.name, email: res.data.email, role: res.data.role });
        toast.success('Profile updated successfully!');
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } finally {
      setSavingDetails(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Missing admin ID — please log out and log back in.');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('Enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await updateAdminServerAction(user.id, { password: newPassword });
      if (res.ok) {
        toast.success('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message || 'Failed to update password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="p-6 sm:p-8 shadow-xs border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar
            fallback={fallbackInitials}
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt={displayName}
            className="w-20 h-20 text-xl border border-gray-200 shadow-sm"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900 capitalize">{displayName}</h1>
              <Badge variant="active" className="capitalize">{userRole}</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{user?.email || 'admin@eezit.com'}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Admin ID: {adminId}</p>
          </div>
        </div>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-xs border-gray-100">
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Account Details</h3>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@eezit.com"
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
              <span>Role</span>
              <Badge variant="secondary" className="capitalize">{userRole}</Badge>
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={savingDetails || !user?.id} className="gap-2">
                {savingDetails && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingDetails ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 shadow-xs border-gray-100">
          <div className="space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Security</h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <p className="font-bold text-gray-900">Change Password</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" variant="outline" size="sm" disabled={savingPassword || !user?.id} className="gap-2">
                {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xs">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-xs">Not enabled</p>
                </div>
              </div>
              <Badge variant="secondary">Coming soon</Badge>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
