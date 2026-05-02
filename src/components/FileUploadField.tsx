import { Upload, X } from 'lucide-react';
import { useRef } from 'react';
import { validateFile } from '../utils/validation';

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  file?: File | null;
  files?: File[];
  onChange: (file: File | null) => void;
  onMultiChange?: (files: File[]) => void;
  error?: string;
  hint?: string;
}

export default function FileUploadField({
  label,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  multiple = false,
  file,
  files = [],
  onChange,
  onMultiChange,
  error,
  hint,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    if (multiple && onMultiChange) {
      const arr = Array.from(selected);
      const valid = arr.filter((f) => !validateFile(f));
      onMultiChange(valid);
    } else {
      const f = selected[0];
      const err = validateFile(f);
      if (!err) onChange(f);
    }
    e.target.value = '';
  };

  const activeFile = multiple ? null : file;
  const activeFiles = multiple ? files : [];

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>

      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}

      <div
        className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
          error
            ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
            : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-900'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={handleChange}
        />

        {!activeFile && activeFiles.length === 0 ? (
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Tap to upload file</span>
          </div>
        ) : (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            {activeFile && (
              <FileChip
                name={activeFile.name}
                size={activeFile.size}
                onRemove={() => onChange(null)}
              />
            )}
            {activeFiles.map((f, i) => (
              <FileChip
                key={i}
                name={f.name}
                size={f.size}
                onRemove={() => {
                  const next = activeFiles.filter((_, idx) => idx !== i);
                  onMultiChange?.(next);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FileChip({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  const kb = Math.round(size / 1024);
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{name}</span>
      <span className="shrink-0 text-xs text-slate-400">{kb} KB</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-slate-400 transition-colors hover:text-red-500"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
