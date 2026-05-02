import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Building2, CheckCircle2,
  Clock, FileText, Layers, MessageSquare, Phone,
} from 'lucide-react';
import { getSubmission, updateSubmissionStatus } from '../../api/admin';
import StatusBadge from '../../components/admin/StatusBadge';
import type { SubmissionDetail, SubmissionStatus } from '../../types/admin';

const STATUS_OPTIONS: SubmissionStatus[] = [
  'new', 'reviewed', 'shortlisted', 'rejected', 'contacted', 'hired', 'duplicate',
];

const STATUS_DOT: Record<string, string> = {
  new: 'bg-blue-500', reviewed: 'bg-yellow-500', shortlisted: 'bg-purple-500',
  rejected: 'bg-red-500', contacted: 'bg-cyan-500', hired: 'bg-green-500', duplicate: 'bg-slate-400',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileUrl(file: string) {
  if (!file) return '';
  if (/^https?:\/\//.test(file)) return file;
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${file.startsWith('/') ? '' : '/'}${file}`;
}

function formatDT(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 px-5 py-3.5 dark:border-slate-800 dark:from-slate-800/80 dark:to-slate-800/40">
        <span className="text-slate-500 dark:text-slate-400">{icon}</span>
        <h2 className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`text-sm text-slate-800 dark:text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('new');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const loadSubmission = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSubmission(Number(id));
      setSubmission(data);
      setNewStatus(data.status);
    } catch {
      setError('Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadSubmission(); }, [loadSubmission]);

  const handleStatusUpdate = async () => {
    if (!submission) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      await updateSubmissionStatus(submission.id, newStatus, note);
      const refreshed = await getSubmission(submission.id);
      setSubmission(refreshed);
      setNewStatus(refreshed.status);
      setNote('');
      setUpdateMsg('Status updated successfully.');
      setUpdateSuccess(true);
    } catch {
      setUpdateMsg('Failed to update status.');
      setUpdateSuccess(false);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !submission) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-800/50 dark:bg-red-900/20">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error || 'Submission not found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate('/horizon-admin/submissions')}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900 dark:text-gray-100">
          {[submission.first_name, submission.middle_name, submission.last_name].filter(Boolean).join(' ') || submission.mobile_number}
        </h1>
        <StatusBadge status={submission.status} />
        {submission.is_possible_duplicate && (
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-700/50">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Possible duplicate</span>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left: main info (2/3 width) ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Overview */}
          <SectionCard icon={<Building2 className="h-4 w-4" />} title="Overview">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              <Field label="First Name" value={submission.first_name} />
              <Field label="Middle Name" value={submission.middle_name} />
              <Field label="Last Name" value={submission.last_name} />
              <Field label="Mobile" value={submission.mobile_number} mono />
              <Field label="Campaign" value={submission.campaign_title} />
              {submission.other_role_title ? (
                <>
                  <Field label="Applied Role" value="Other" />
                  <Field label="Requested Role" value={submission.other_role_title} />
                </>
              ) : (
                <Field label="Applied For" value={submission.applied_role_display ?? '-'} />
              )}
              <Field label="Site" value={submission.site_name ?? ''} />
              <Field label="Submitted" value={formatDT(submission.submitted_at)} />
              <Field label="IP Address" value={submission.ip_address ?? ''} mono />
              <Field label="Language" value={submission.language === 'hi' ? 'हिंदी' : submission.language === 'mr' ? 'मराठी' : 'English'} mono />
            </div>
            {submission.duplicate_reason && (
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-700/50">
                <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">Duplicate Reason</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{submission.duplicate_reason}</p>
              </div>
            )}
          </SectionCard>

          {/* Answers */}
          {submission.answers.length > 0 && (
            <SectionCard icon={<MessageSquare className="h-4 w-4" />} title="Answers">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {submission.answers.map((a) => (
                  <div key={a.id} className="py-3.5 first:pt-0 last:pb-0">
                    <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">{a.field_label_snapshot}</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {Array.isArray(a.value) ? (a.value as string[]).join(', ') : String(a.value ?? '—')}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Documents */}
          {submission.documents.length > 0 && (
            <SectionCard icon={<FileText className="h-4 w-4" />} title="Documents">
              <div className="space-y-2">
                {submission.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{d.original_filename}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{d.document_type} · {formatBytes(d.size_bytes)}</p>
                      </div>
                    </div>
                    {d.file ? (
                      <a
                        href={getFileUrl(d.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-400">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Other applications from same mobile */}
          {submission.other_applications.length > 0 && (
            <SectionCard icon={<Layers className="h-4 w-4" />} title={`Other applications from this mobile (${submission.other_applications.length})`}>
              <div className="space-y-2">
                {submission.other_applications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => navigate(`/horizon-admin/submissions/${app.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-800 dark:hover:bg-blue-900/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {app.full_name || app.mobile_number}
                        </p>
                        {app.is_possible_duplicate && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">Dup</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {app.applied_role_display ?? '-'} · {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">View →</span>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right: actions (1/3 width) ── */}
        <div className="space-y-5">

          {/* Candidate quick-info */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white dark:bg-blue-800">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {[submission.first_name, submission.middle_name, submission.last_name].filter(Boolean).join(' ') || '—'}
                </p>
                <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{submission.mobile_number}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Submission #{submission.id}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDT(submission.submitted_at)}</p>
            </div>
          </div>

          {/* Update Status */}
          <SectionCard icon={<CheckCircle2 className="h-4 w-4" />} title="Update Status">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a review note…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-slate-500"
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === submission.status}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                {updating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving…
                  </>
                ) : 'Save Status'}
              </button>
              {updateMsg && (
                <p className={`text-center text-xs ${updateSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {updateMsg}
                </p>
              )}
            </div>
          </SectionCard>

          {/* Review History timeline */}
          {submission.reviews.length > 0 && (
            <SectionCard icon={<Clock className="h-4 w-4" />} title="Review History">
              <div className="relative">
                <div className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-px bg-slate-100 dark:bg-slate-800" />
                <ul className="space-y-5">
                  {submission.reviews.map((r) => (
                    <li key={r.id} className="relative pl-6">
                      <span className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm dark:border-slate-900 ${STATUS_DOT[r.new_status] ?? 'bg-slate-400'}`} />
                      <div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs capitalize text-slate-500 dark:text-slate-400">{r.old_status}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">→</span>
                          <span className="text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">{r.new_status}</span>
                        </div>
                        {r.note && (
                          <p className="mt-0.5 text-xs italic text-slate-500 dark:text-slate-400">"{r.note}"</p>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          {r.reviewed_by_name ?? 'System'} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          )}
        </div>

      </div>
    </div>
  );
}
