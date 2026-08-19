'use client';

import React from 'react';
import { Mail, Shield, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// Read-only: there's no admin "update profile" endpoint yet (see server-actions/), so this
// just mirrors whatever the login response put into AuthContext rather than pretending to be
// an editable form. Change Password / 2FA are flagged "Coming soon" for the same reason.
export default function ProfilePage() {
  const { user, logout } = useAuth();

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Admin');
  const userRole = user?.role || 'Administrator';
  const fallbackInitials = displayName.substring(0, 2).toUpperCase();
  const adminId = user?.id ? `AD_${user.id.slice(-6).toUpperCase()}` : 'N/A';

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
        <Card className="p-6 shadow-xs space-y-4 border-gray-100">
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Account Details</h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>Full Name</span>
              <span className="font-semibold text-gray-900 capitalize">{displayName}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Email Address</span>
              <span className="font-semibold text-gray-900">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Role</span>
              <Badge variant="secondary" className="capitalize">{userRole}</Badge>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Admin ID</span>
              <span className="font-semibold text-gray-900">{adminId}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Account Status</span>
              <Badge variant="active">Active</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-xs space-y-4 border-gray-100">
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Security</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Password</p>
                  <p className="text-gray-400">••••••••••</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled title="Coming soon">Change</Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-gray-400">Not enabled</p>
                </div>
              </div>
              <Badge variant="secondary">Coming soon</Badge>
            </div>

            <div className="pt-2 border-t border-gray-100">
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
