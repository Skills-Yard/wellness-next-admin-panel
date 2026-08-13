'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Save, AlertCircle } from 'lucide-react';
import { User, UpdateUserPayload } from '../../../types/user';
import UserHeaderProfile from '../header/UserHeaderProfile';
import { Card } from '../../ui/card';
import { Avatar } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface UserEditTabProps {
  user: User;
  onSave: (payload: UpdateUserPayload) => Promise<void>;
}

export default function UserEditTab({ user, onSave }: UserEditTabProps) {
  const router = useRouter();

  // Pre-fill with REAL user data from the API — no fake fallback names
  const [formData, setFormData] = useState<UpdateUserPayload>({
    name: user.name ?? '',
    email: user.email ?? '',
    countryCode: user.countryCode ?? '+91',
    phone: user.phone ?? '',
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.split('T')[0]   // ISO → "YYYY-MM-DD" for <input type="date">
      : '',
    gender: user.gender ?? '',
    isActive: user.isActive,
    isPhoneVerified: user.isPhoneVerified,
    isProfileComplete: user.isProfileComplete,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Only send fields that actually have a value (avoid overwriting with empty)
      const payload: UpdateUserPayload = {};
      if (formData.name !== undefined) payload.name = formData.name;
      if (formData.email !== undefined) payload.email = formData.email;
      if (formData.countryCode) payload.countryCode = formData.countryCode;
      if (formData.phone !== undefined) payload.phone = formData.phone;
      if (formData.dateOfBirth !== undefined) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.gender !== undefined) payload.gender = formData.gender;
      payload.isActive = formData.isActive;
      payload.isPhoneVerified = formData.isPhoneVerified;
      payload.isProfileComplete = formData.isProfileComplete;

      await onSave(payload);
      router.push(`/users/${user.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/users" className="hover:text-gray-900 transition-colors">
          Users
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href={`/users/${user.id}`} className="hover:text-gray-900 transition-colors">
          {user.name || user.id}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-amber-600 font-semibold">Edit</span>
      </div>

      {/* Profile Header */}
      <UserHeaderProfile user={user} />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Personal Information ── */}
        <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Personal Information
          </h3>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              type="text"
              value={formData.name ?? ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email ?? ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. priya@gmail.com"
            />
          </div>

          {/* Country Code + Phone */}
          <div className="space-y-1.5">
            <Label>Country Code & Phone</Label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={formData.countryCode ?? '+91'}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (UAE)</option>
              </select>
              <Input
                type="tel"
                value={formData.phone ?? ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="98765 43210"
                className="col-span-2"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Changing phone number will require OTP verification.</p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-dob">Date of Birth</Label>
            <Input
              id="edit-dob"
              type="date"
              value={formData.dateOfBirth ?? ''}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-gender">Gender</Label>
            <select
              id="edit-gender"
              value={formData.gender ?? ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all"
            >
              <option value="">— Select gender —</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Profile Photo */}
          <div className="flex items-center gap-4 pt-2">
            <Avatar
              src={user.avatarUrl || user.profilePhotoKey || undefined}
              alt={user.name || 'User'}
              fallback={(user.name || 'U').substring(0, 2).toUpperCase()}
              className="w-14 h-14 rounded-2xl border border-gray-200"
            />
            <div>
              <Button type="button" variant="outline" size="sm">
                Upload New Photo
              </Button>
              <p className="text-[11px] text-gray-400 mt-1">JPEG, PNG up to 2MB</p>
            </div>
          </div>
        </Card>

        {/* ── Account Information ── */}
        <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Account Information
            </h3>

            {/* Read-only: Account ID */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-account-id">Account ID</Label>
              <Input
                id="edit-account-id"
                type="text"
                readOnly
                value={user.accountCode || `USR-${user.id.substring(0, 6).toUpperCase()}`}
                className="bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400">This field is auto-generated and cannot be changed.</p>
            </div>

            {/* Read-only: Referral Code */}
            {user.referralCode && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-referral">Referral Code</Label>
                <Input
                  id="edit-referral"
                  type="text"
                  readOnly
                  value={user.referralCode}
                  className="bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
            )}

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Account Status</Label>
              <select
                id="edit-status"
                value={formData.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <p className="text-[11px] text-gray-400">Setting to Inactive will prevent user from logging in.</p>
            </div>

            {/* Phone Verified toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-gray-700">Phone Verified</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {formData.isPhoneVerified ? 'Phone number is verified' : 'Phone number not yet verified'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPhoneVerified: !formData.isPhoneVerified })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                  formData.isPhoneVerified ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Profile Complete toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-gray-700">Profile Complete</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {formData.isProfileComplete ? 'Profile is marked as complete' : 'Profile is incomplete'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isProfileComplete: !formData.isProfileComplete })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                  formData.isProfileComplete ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/users/${user.id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
