import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
        <p className="text-base font-medium text-slate-600 dark:text-slate-300">Loading application form...</p>
      </div>
    </div>
  );
}
