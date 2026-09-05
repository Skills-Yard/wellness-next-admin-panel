'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { RecipientRole } from '../../types/notification';
import { getUsersPagedServerAction } from '../../lib/server-actions/user';
import { getPartnersPagedServerAction } from '../../lib/server-actions/partner';

interface Row {
  id: string;
  title: string;
  subtitle?: string | null;
}

interface RecipientPickerModalProps {
  isOpen: boolean;
  role: RecipientRole;
  initialSelected: string[];
  onClose: () => void;
  onConfirm: (recipientIds: string[]) => void;
}

// Selected-audience picker — paginated search over Users or Partners (reusing
// the same paged server actions the list pages already use), with a
// checkbox per row. Selection accumulates in a Set across pages/searches so
// switching pages never silently drops a prior pick; "Done" hands the full
// set back to the caller. There's no bulk-selection precedent anywhere else
// in this codebase (UserListTable/PartnerListTable have no row checkboxes),
// so this is deliberately simple rather than trying to match an existing
// pattern that doesn't exist yet.
export default function RecipientPickerModal({
  isOpen,
  role,
  initialSelected,
  onClose,
  onConfirm,
}: RecipientPickerModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) setSelected(new Set(initialSelected));
    // Only seed from the caller when the picker (re)opens — not on every
    // initialSelected reference change, or a parent re-render mid-pick would
    // stomp on choices made inside this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (role === 'USERS') {
        const res = await getUsersPagedServerAction({ page, limit: 20, q: search || undefined });
        setRows((res.data ?? []).map((u) => ({ id: u.id, title: u.name || 'Unnamed', subtitle: u.phone || u.email })));
        setTotalPages(res.pagination?.totalPages ?? 1);
      } else {
        const res = await getPartnersPagedServerAction({ page, limit: 20, q: search || undefined });
        setRows((res.data ?? []).map((p) => ({ id: p.id, title: p.name || 'Unnamed', subtitle: p.phone || p.city })));
        setTotalPages(res.pagination?.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [isOpen, role, page, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose {role === 'USERS' ? 'users' : 'partners'}</DialogTitle>
          <DialogDescription>Search and check who should receive this notification.</DialogDescription>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${role === 'USERS' ? 'users' : 'partners'} by name or phone`}
            className="pl-10"
          />
        </div>

        <div className="max-h-80 overflow-y-auto modal-scroll border border-gray-100 rounded-xl divide-y divide-gray-100">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No results.</p>
          ) : (
            rows.map((row) => (
              <label
                key={row.id}
                className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50"
              >
                <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggle(row.id)} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 truncate">{row.title}</p>
                  {row.subtitle && <p className="text-[11px] text-gray-500 truncate">{row.subtitle}</p>}
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>

        <DialogFooter className="items-center !justify-between">
          <span className="text-xs font-semibold text-gray-700">{selected.size} selected</span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => onConfirm(Array.from(selected))}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
