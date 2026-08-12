'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, ChevronDown, Loader2, Check } from 'lucide-react';

export interface LibraryColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface LibraryRow {
  id: string;
  categoryIds?: string[];
  searchText: string;
  cells: Record<string, React.ReactNode>;
  // Raw data handed back to onSave when this row is picked.
  payload: unknown;
}

interface LibraryPickerModalProps {
  isOpen: boolean;
  // e.g. "Duration" -> renders "Duration Library" title.
  label: string;
  columns: LibraryColumn[];
  rows: LibraryRow[];
  categories?: { id: string; name: string }[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  // Renders just the search/table/footer (no backdrop/card/close button/title) for use inside
  // AddSectionModal's "Library" tab.
  embedded?: boolean;
  onClose: () => void;
  // Called once with every selected row's payload (in selection order) when "Save Selected" is
  // clicked — callers batch-apply the whole array in one go rather than being invoked per row.
  onSave: (payloads: unknown[]) => void | Promise<void>;
}

// Third step of the 3-step Add flow — a searchable, category-filterable, paginated multi-select
// table shared by every section's Library picker. Columns/rows are supplied by the caller
// (see useLibrarySections), so this component has no section-specific knowledge at all.
export default function LibraryPickerModal({
  isOpen,
  label,
  columns,
  rows,
  categories = [],
  loading = false,
  emptyMessage = 'No items in the library yet.',
  pageSize = 5,
  embedded = false,
  onClose,
  onSave,
}: LibraryPickerModalProps) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setCategoryId('');
      setPage(1);
      setSelectedIds(new Set());
      setSaving(false);
    }
  }, [isOpen]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q || row.searchText.toLowerCase().includes(q);
      const matchesCategory = !categoryId || (row.categoryIds ?? []).includes(categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [rows, search, categoryId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!isOpen) return null;

  // "Select all" reflects/toggles every row matching the current search + category filter
  // (across all pages), not just the current page — recomputed each render off `filtered` so it
  // stays correct as the user keeps refining the search.
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const handleSave = async () => {
    const picked = rows.filter((r) => selectedIds.has(r.id));
    if (picked.length === 0 || saving) return;
    setSaving(true);
    try {
      await onSave(picked.map((r) => r.payload));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        {categories.length > 0 && (
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-[#25180F] focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] cursor-pointer"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#25180F] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto min-h-[120px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-[#FAF5F0] text-gray-900 text-xs font-semibold border-b border-black/8">
              <th className="py-3 px-4 w-8">
                {filtered.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    title={allFilteredSelected ? 'Deselect all' : 'Select all matching'}
                    className={`inline-flex items-center justify-center w-4 h-4 rounded border ${allFilteredSelected ? 'border-[#25180F] bg-[#25180F]' : 'border-[#25180F]/60'}`}
                  >
                    {allFilteredSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                )}
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading...
                  </span>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-xs text-gray-400">
                  {filtered.length === 0 && rows.length > 0 ? 'No matches found.' : emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => toggleRow(row.id)}
                  className="hover:bg-gray-50/50 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border ${selectedIds.has(row.id) ? 'border-[#25180F] bg-[#25180F]' : 'border-[#25180F]/60'}`}
                    >
                      {selectedIds.has(row.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {row.cells[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-gray-500">
          {filtered.length === 0
            ? 'Showing 0 of 0'
            : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`}
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-[#C68A4C]">· {selectedIds.size} selected</span>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-40 hover:bg-gray-200 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-full bg-[#25180F] text-white flex items-center justify-center disabled:opacity-40 hover:bg-black transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={selectedIds.size === 0 || saving}
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-[#25180F] text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving...' : `Save Selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
        </button>
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">{label} Library</h3>

        {content}
      </div>
    </div>
  );
}
