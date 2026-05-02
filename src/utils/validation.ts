import { z } from 'zod';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const mobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .transform((val) => val.trim().replace(/\s+/g, ''))
  .refine(
    (val) => /^(\+91)?[6-9]\d{9}$/.test(val),
    'Enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210)'
  );

export const staticFormSchema = z.object({
  mobile_number: mobileSchema,
  first_name: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  role_id: z.string().optional(),
  other_role_title: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.role_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['role_id'],
      message: 'Select a role or choose Other',
    });
  }
  if (data.role_id === 'other' && !data.other_role_title?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['other_role_title'],
      message: 'Role applying for is required',
    });
  }
});

export type StaticFormValues = z.infer<typeof staticFormSchema>;

export function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" is not allowed. Use PDF, DOC, DOCX, JPG, JPEG, or PNG.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds 10 MB.`;
  }
  return null;
}

export function normalizeMobile(mobile: string): string {
  const trimmed = mobile.trim().replace(/\s+/g, '');
  return trimmed.startsWith('+91') ? trimmed.slice(3) : trimmed;
}
