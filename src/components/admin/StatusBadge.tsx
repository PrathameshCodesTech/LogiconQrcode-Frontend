import type { SubmissionStatus } from '../../types/admin';

const CONFIG: Record<SubmissionStatus, { label: string; classes: string; dot: string }> = {
  new:         { label: 'New',         dot: 'bg-blue-500',   classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50' },
  reviewed:    { label: 'Reviewed',    dot: 'bg-yellow-500', classes: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-700/50' },
  shortlisted: { label: 'Shortlisted', dot: 'bg-purple-500', classes: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-700/50' },
  rejected:    { label: 'Rejected',    dot: 'bg-red-500',    classes: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50' },
  contacted:   { label: 'Contacted',   dot: 'bg-cyan-500',   classes: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-700/50' },
  hired:       { label: 'Hired',       dot: 'bg-green-500',  classes: 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50' },
  duplicate:   { label: 'Duplicate',   dot: 'bg-slate-400',  classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/50' },
};

interface Props {
  status: SubmissionStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const cfg = CONFIG[status] ?? { label: status, dot: 'bg-slate-400', classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-normal ${cfg.classes} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
