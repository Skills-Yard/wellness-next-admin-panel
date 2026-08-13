'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { User } from '../../../types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

interface DeactivateUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, reason?: string) => Promise<void>;
}

export default function DeactivateUserModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: DeactivateUserModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await onConfirm(user.id, reason);
      setReason('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen && !!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Deactivate User</DialogTitle>
              <DialogDescription>
                This action will prevent the user from logging in. All data will be retained.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-xs text-gray-600 leading-relaxed -mt-1">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-gray-900">{user?.name || 'this user'}</span>?
          This user will not be able to login or access their account. All their data will be retained.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="deactivate-reason">
              Reason for deactivation{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <textarea
              id="deactivate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading} size="sm">
              {loading ? 'Deactivating...' : 'Deactivate User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
