import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
}

export default function ErrorState({ title = 'Unable to load form', message }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
