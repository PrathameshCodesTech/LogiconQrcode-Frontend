import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  count: number;
  pageSize?: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, count, pageSize = 20, onPrev, onNext }: Props) {
  const totalPages = Math.ceil(count / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  const btnClass =
    'flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400';

  return (
    <div className="flex items-center justify-between px-6 py-4 text-sm">
      <span className="text-slate-500 dark:text-slate-400">
        {count === 0
          ? 'No results'
          : (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{from}–{to}</span>
              {' '}of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{count}</span>
            </>
          )}
      </span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page <= 1} className={btnClass}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex h-9 min-w-[3.5rem] items-center justify-center rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {page} / {totalPages || 1}
        </span>
        <button onClick={onNext} disabled={page >= totalPages} className={btnClass}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
