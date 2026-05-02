import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Users } from 'lucide-react';
import { getSubmissions, getSubmissionResumeUrl, updateSubmissionStatus, exportSubmissionsExcel } from '../../api/admin';
import FilterBar from '../../components/admin/FilterBar';
import Pagination from '../../components/admin/Pagination';
import StatusBadge from '../../components/admin/StatusBadge';
import type { PaginatedResponse, SubmissionFilters, SubmissionListItem } from '../../types/admin';

const ALL_STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected', 'contacted', 'hired', 'duplicate'] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'hired', label: 'Hired' },
  { value: 'duplicate', label: 'Duplicate' },
];

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="h-3.5 w-6 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3.5 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Users className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No submissions found</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
    </div>
  );
}

interface RowProps {
  submission: SubmissionListItem;
  onStatusChange: (id: number, status: string) => void;
  onResumeDownload: (id: number) => void;
  refreshing: boolean;
}

const STATUS_COLORS: Record<string, { label: string; dot: string; bg: string; text: string; ring: string; darkBg: string; darkText: string; darkRing: string }> = {
  new:         { label: 'New',         dot: 'bg-blue-500',   bg: 'bg-blue-50',      text: 'text-blue-700',   ring: 'ring-blue-200',   darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300', darkRing: 'dark:ring-blue-700/50' },
  reviewed:    { label: 'Reviewed',     dot: 'bg-yellow-500', bg: 'bg-yellow-50',     text: 'text-yellow-700',  ring: 'ring-yellow-200',  darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-300', darkRing: 'dark:ring-yellow-700/50' },
  shortlisted: { label: 'Shortlisted',  dot: 'bg-purple-500', bg: 'bg-purple-50',    text: 'text-purple-700', ring: 'ring-purple-200', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300', darkRing: 'dark:ring-purple-700/50' },
  rejected:    { label: 'Rejected',      dot: 'bg-red-500',    bg: 'bg-red-50',        text: 'text-red-700',    ring: 'ring-red-200',    darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300', darkRing: 'dark:ring-red-700/50' },
  contacted:   { label: 'Contacted',    dot: 'bg-cyan-500',   bg: 'bg-cyan-50',      text: 'text-cyan-700',   ring: 'ring-cyan-200',   darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-300', darkRing: 'dark:ring-cyan-700/50' },
  hired:       { label: 'Hired',         dot: 'bg-green-500',  bg: 'bg-green-50',     text: 'text-green-700',  ring: 'ring-green-200',  darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-300', darkRing: 'dark:ring-green-700/50' },
  duplicate:   { label: 'Duplicate',     dot: 'bg-slate-400',  bg: 'bg-slate-100',    text: 'text-slate-600',  ring: 'ring-slate-200',  darkBg: 'dark:bg-slate-800', darkText: 'dark:text-slate-400', darkRing: 'dark:ring-slate-600/50' },
};

function StatusDropdown({ submission, onStatusChange, refreshing }: RowProps) {
  const cfg = STATUS_COLORS[submission.status] ?? STATUS_COLORS.duplicate;
  return (
    <div
      className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkRing} ${refreshing ? 'opacity-50' : 'cursor-pointer'} group/status`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      <select
        value={submission.status}
        disabled={refreshing}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(submission.id, e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          const select = e.currentTarget.querySelector('select') as HTMLSelectElement | null;
          if (select) select.focus();
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0 focus:outline-none"
        style={{ color: 'inherit' }}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <span className="select-none">{cfg.label}</span>
      <span className="pointer-events-none select-none text-[10px] opacity-60">▾</span>
    </div>
  );
}

export default function SubmissionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SubmissionFilters>({ page: 1 });
  const [result, setResult] = useState<PaginatedResponse<SubmissionListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshingStatuses, setRefreshingStatuses] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubmissions(filters);
      setResult(data);
    } catch {
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (id: number, status: string) => {
    setRefreshingStatuses((s) => new Set([...s, id]));
    try {
      await updateSubmissionStatus(id, status);
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results.map((s) => s.id === id ? { ...s, status: status as typeof s.status } : s),
        };
      });
    } catch {
      // revert — reload to get correct state
      void load();
    } finally {
      setRefreshingStatuses((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleResumeDownload = async (id: number) => {
    try {
      const url = await getSubmissionResumeUrl(id);
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // silently fail
    }
  };

  const page = filters.page ?? 1;
  const activeStatus = filters.status ?? '';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submissions</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Review and manage candidate applications</p>
      </div>

      {/* Status quick-filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilters({ ...filters, status: tab.value || undefined, page: 1 })}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-md dark:bg-blue-800'
                  : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-blue-300 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:ring-blue-600'
              }`}
            >
              {tab.label}
              {tab.value === '' && result != null && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}>
                  {result.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30 sm:hidden">
          <span className="text-xs text-slate-400">{result?.count ?? 0} results</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
          <span className="hidden text-xs text-slate-400 sm:block">{result?.count ?? 0} results</span>
          <button
            onClick={() => {
              setLoading(true);
              exportSubmissionsExcel(filters)
                .catch(() => setError('Export failed. Please try again.'))
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-800 dark:hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            {loading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {result?.results.length === 0 && <EmptyState />}
              {result?.results.map((s) => (
                <div
                  key={s.id}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/horizon-admin/submissions/${s.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ') || s.mobile_number}
                      </p>
                      {s.is_possible_duplicate && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Dup</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.mobile_number}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{s.campaign_title} · {s.applied_role_display ?? '-'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(s.submitted_at)}</p>
                    {s.language !== 'en' && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        s.language === 'hi' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      }`}>
                        {s.language === 'hi' ? 'हिंदी' : 'मराठी'}
                      </span>
                    )}
                    {s.same_mobile_campaign_count > 1 && (
                      <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {s.same_mobile_campaign_count} role{s.same_mobile_campaign_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={s.status} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResumeDownload(s.id); }}
                      className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      <Download className="h-3 w-3" />
                      Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 text-left dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">#</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Mobile</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Campaign</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Lang</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Dup?</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">No. of Roles</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Submitted</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Resume</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result?.results.length === 0 && (
                    <tr>
                      <td colSpan={12}><EmptyState /></td>
                    </tr>
                  )}
                  {result?.results.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/horizon-admin/submissions/${s.id}`)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
                    >
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500">{s.id}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 transition-colors group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-400">
                          {[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ') || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{s.mobile_number}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.campaign_title}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.applied_role_display ?? '-'}</td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          submission={s}
                          onStatusChange={handleStatusChange}
                          onResumeDownload={handleResumeDownload}
                          refreshing={refreshingStatuses.has(s.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.language === 'hi' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          s.language === 'mr' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {s.language === 'hi' ? 'हिंदी' : s.language === 'mr' ? 'मराठी' : 'EN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {s.is_possible_duplicate
                          ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Yes</span>
                          : <span className="text-xs text-slate-400 dark:text-slate-500">No</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {s.same_mobile_campaign_count > 1
                          ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                              {s.same_mobile_campaign_count} role{s.same_mobile_campaign_count > 1 ? 's' : ''}
                            </span>
                          )
                          : <span className="text-xs text-slate-300 dark:text-slate-600">1</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(s.submitted_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResumeDownload(s.id); }}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result && result.count > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  page={page}
                  count={result.count}
                  onPrev={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  onNext={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
