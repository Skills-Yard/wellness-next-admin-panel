'use client';

import React, { useRef, useState } from 'react';
import { toast } from '../../components/ui/toast';
import {
  Mail,
  Shield,
  KeyRound,
  LogOut,
  Loader2,
  Camera,
  CalendarCheck,
  Clock,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNow } from '../../hooks/useNow';
import { updateMyAdminServerAction } from '../../lib/server-actions/admin';
import { uploadAdminAvatar } from '../../lib/uploadAdminAvatar';
import { cdnUrl } from '../../lib/cdn';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

// Cheap client-side hint only — the backend has no password policy of its own
// beyond a 6-char minimum. Score 0..4 across length + character variety.
function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '—' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(score, 4);
  const label = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return { score, label };
}

const STRENGTH_BAR_COLORS = ['bg-gray-200', 'bg-rose-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

// Same shape as the helper in components/admins/list/AdminListRow.tsx.
// `now` is injected (rather than read via Date.now() in here) so the caller
// can drive it from useNow() and get a live-updating result — see lastActive
// below.
function timeAgo(dateStr: string | null | undefined, now: number = Date.now()): string {
  if (!dateStr) return '—';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 1) return `${mins} minutes ago`;
  return 'Just now';
}

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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarSrc = avatarPreview ?? cdnUrl(user?.profilePhotoKey);
  const strength = scorePassword(newPassword);
  const accountActive = user?.isActive !== false;
  // Ticks every 30s so "Last Active" counts up live instead of only updating
  // on the next unrelated re-render (which used to require a page refresh).
  const now = useNow(30_000);
  const lastActive = user?.lastLoginAt ? timeAgo(user.lastLoginAt, now) : 'Just now';

  // Role is deliberately not editable here — PATCH /admin/me doesn't accept a
  // role at all (UpdateAdminProfileDto omits it), because letting an admin grant
  // themselves a higher one from their own profile page is a privilege-escalation
  // hole. Role changes belong on the admin-management screen.

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 5MB or smaller.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingAvatar(true);
    try {
      const { r2Key } = await uploadAdminAvatar(file);
      const res = await updateMyAdminServerAction({ profilePhotoKey: r2Key });
      if (res.ok) {
        updateUser({ profilePhotoKey: res.data?.profilePhotoKey ?? r2Key });
        toast.success('Profile photo updated!');
        setAvatarPreview(null);
      } else {
        toast.error(res.message || 'Failed to save profile photo');
        setAvatarPreview(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { name?: string; email?: string } = {};
    if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to update.');
      return;
    }
    setSavingDetails(true);
    try {
      const res = await updateMyAdminServerAction(payload);
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
    if (!newPassword.trim()) {
      toast.error('Enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await updateMyAdminServerAction({ password: newPassword });
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 flex-1">
            {/* Avatar with upload control */}
            <div className="relative w-20 h-20 shrink-0">
              <Avatar
                fallback={fallbackInitials}
                src={avatarSrc}
                alt={displayName}
                className="w-20 h-20 text-xl border border-gray-200 shadow-sm"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#C68A4C] text-white flex items-center justify-center shadow-md ring-2 ring-white hover:bg-[#b3793d] transition-colors disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

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

          {/* Status panel — hydrated from GET /admin/me via AuthContext */}
          <div className="flex gap-8 lg:gap-6 lg:pl-6 lg:border-l lg:border-gray-100">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Account Status</p>
                <p className={`text-sm font-semibold ${accountActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {accountActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Last Active</p>
                <p className="text-sm font-semibold text-gray-900">{lastActive}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-xs border-gray-100">
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Account Details</h3>
                <p className="text-xs text-gray-400">Manage your personal information and account details.</p>
              </div>
            </div>

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
              <Button type="submit" size="sm" disabled={savingDetails} className="gap-2">
                {savingDetails && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingDetails ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 shadow-xs border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Security</h3>
                <p className="text-xs text-gray-400">Keep your account secure and protected.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Change Password</p>
                  <p className="text-gray-400">Update your password regularly to keep your account secure.</p>
                </div>
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

              <div className="flex items-center justify-between gap-4">
                <Button type="submit" variant="outline" size="sm" disabled={savingPassword} className="gap-2">
                  {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
                <div className="flex-1 max-w-[160px]">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                    <span>Password strength</span>
                    <span className="font-semibold text-gray-500">{strength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          newPassword && strength.score >= i
                            ? STRENGTH_BAR_COLORS[strength.score]
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
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
