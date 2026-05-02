import { Search, X } from 'lucide-react';
import type { SubmissionFilters } from '../../types/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'hired', label: 'Hired' },
  { value: 'duplicate', label: 'Duplicate' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'role_id:1', label: 'Housekeeping' },
  { value: 'role_id:2', label: 'Security Guard' },
  { value: 'role_id:3', label: 'Electrician' },
  { value: 'role_id:4', label: 'Plumber' },
  { value: 'role_id:5', label: 'Supervisor' },
  { value: 'role_filter:other', label: 'Other' },
];

interface Props {
  filters: SubmissionFilters;
  onChange: (filters: SubmissionFilters) => void;
}

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:bg-slate-800 dark:[color-scheme:dark]';

export default function FilterBar({ filters, onChange }: Props) {
  const set = (key: keyof SubmissionFilters, value: string) => {
    const updated = { ...filters, [key]: value || undefined, page: 1 };
    if (key === 'role_filter') {
      delete updated.role_id;
      onChange(updated);
    } else if (key === 'role_id') {
      delete updated.role_filter;
      onChange(updated);
    } else {
      onChange(updated);
    }
  };

  const clear = () => onChange({ page: 1, status: undefined, search: undefined, date_from: undefined, date_to: undefined, role_id: undefined, role_filter: undefined });

  const hasFilters = Boolean(
    filters.search || filters.status || filters.date_from || filters.date_to ||
    filters.role_id || filters.role_filter
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/30">
      {/* Search */}
      <div className="relative min-w-56 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search name or mobile..."
          value={filters.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
          className={`${inputClass} w-full pl-8`}
        />
      </div>

      {/* Status */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => set('status', e.target.value)}
        className={inputClass}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Role */}
      <select
        value={filters.role_filter === 'other' ? 'role_filter:other' : filters.role_id ? `role_id:${filters.role_id}` : ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) { set('role_id', ''); return; }
          const [key, id] = val.split(':');
          if (key === 'role_filter') set('role_filter', id);
          else set('role_id', id);
        }}
        className={inputClass}
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400">From</span>
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => set('date_from', e.target.value)}
          className={inputClass}
        />
        <span className="text-xs font-medium text-slate-400">To</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => set('date_to', e.target.value)}
          className={inputClass}
        />
      </div>

      {hasFilters && (
        <button
          onClick={clear}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
