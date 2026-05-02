import { CheckCircle } from 'lucide-react';
import { t, type LangCode } from '../utils/i18n';

interface SuccessStateProps {
  isDuplicate: boolean;
  campaignTitle: string;
  lang?: LangCode;
}

export default function SuccessState({ isDuplicate, campaignTitle, lang = 'en' }: SuccessStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">{isDuplicate ? t(lang, 'duplicateTitle') : t(lang, 'successTitle')}</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{campaignTitle}</p>

        {isDuplicate ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 leading-relaxed">
            Your application was received. Our team may review your latest submission.
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Thank you for applying. Our team will review your application and get in touch with you.
          </p>
        )}
      </div>
    </div>
  );
}
