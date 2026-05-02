import type { FormField } from '../types/campaign';
import { t, type LangCode } from '../utils/i18n';

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  lang?: LangCode;
  translatedLabel?: string;
  translatedHelpText?: string;
  translatedOptions?: string[];
}

const inputClass =
  'w-full min-h-[44px] px-3 py-2.5 text-sm text-slate-950 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-slate-400 disabled:bg-slate-50 dark:text-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:disabled:bg-slate-900';

function formatSalaryHint(value: unknown): string {
  if (value === '' || value == null) return '';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '';

  const compact = (num: number) => Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '');

  if (amount >= 10000000) return `Approx. ₹${compact(amount / 10000000)} crore`;
  if (amount >= 100000) return `Approx. ₹${compact(amount / 100000)} lakh`;
  if (amount >= 1000) return `Approx. ₹${compact(amount / 1000)}k`;
  return `Approx. ₹${amount.toLocaleString('en-IN')}`;
}

export default function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  lang = 'en',
  translatedLabel,
  translatedHelpText,
  translatedOptions,
}: FormFieldRendererProps) {
  const strVal = value == null ? '' : String(value);
  const displayLabel = translatedLabel ?? field.label;
  const displayHelpText = translatedHelpText ?? field.help_text;
  const displayOptions = translatedOptions ?? field.options;
  const salaryHint = field.field_key === 'expected_salary' ? formatSalaryHint(value) : '';

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {displayLabel}
        {field.is_required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {displayHelpText && (
        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{displayHelpText}</p>
      )}

      {field.field_type === 'text' && (
        <input
          type="text"
          className={inputClass}
          placeholder={field.placeholder || displayLabel}
          value={strVal}
          maxLength={field.max_length ?? undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.field_type === 'textarea' && (
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          placeholder={field.placeholder || displayLabel}
          value={strVal}
          maxLength={field.max_length ?? undefined}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      )}

      {field.field_type === 'number' && (
        <>
          <input
            type="number"
            className={inputClass}
            placeholder={field.placeholder || displayLabel}
            value={strVal}
            min={field.min_value ?? undefined}
            max={field.max_value ?? undefined}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {salaryHint && (
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{salaryHint}</p>
          )}
        </>
      )}

      {field.field_type === 'date' && (
        <input
          type="date"
          className={inputClass}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.field_type === 'email' && (
        <input
          type="email"
          className={inputClass}
          placeholder={field.placeholder || 'email@example.com'}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.field_type === 'select' && (
        <select
          className={`${inputClass} appearance-none cursor-pointer`}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{t(lang, 'selectField')} {displayLabel}</option>
          {displayOptions.map((opt, idx) => (
            <option key={opt} value={field.options[idx] ?? opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.field_type === 'multi_select' && (
        <div className="space-y-2 pt-1">
          {displayOptions.map((opt, idx) => {
            const rawOpt = field.options[idx] ?? opt;
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(rawOpt);
            return (
              <label key={rawOpt} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? arr.filter((v) => v !== rawOpt) : [...arr, rawOpt];
                    onChange(next);
                  }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {field.field_type === 'boolean' && (
        <label className="flex items-center gap-3 cursor-pointer pt-1">
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700" />
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-200">
            {value === true ? t(lang, 'yes') : t(lang, 'no')}
          </span>
        </label>
      )}

      {field.field_type === 'file' && (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t(lang, 'fileFieldHint')}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
