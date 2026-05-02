import { z } from 'zod';
import type { FormField } from '../types/campaign';
import { t, type LangCode } from './i18n';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Rejects digits and common junk chars; allows Unicode letters for Indian names.
const NO_DIGITS_RE = /^[^\d_@#$%^&*+=<>?/\\|{}[\]~`]+$/u;

export function createStaticFormSchema(lang: LangCode = 'en') {
  const mobileSchema = z
    .string()
    .min(1, t(lang, 'mobileRequiredError'))
    .transform((val) => val.trim().replace(/\s+/g, ''))
    .refine(
      (val) => /^(\+91)?[6-9]\d{9}$/.test(val),
      t(lang, 'mobileInvalid')
    );

  return z.object({
    mobile_number: mobileSchema,
    first_name: z
      .string()
      .min(1, t(lang, 'firstNameRequiredError'))
      .min(2, t(lang, 'firstNameMinError'))
      .regex(NO_DIGITS_RE, t(lang, 'nameNumberError')),
    middle_name: z
      .string()
      .optional()
      .refine(
        (val) => !val || !val.trim() || NO_DIGITS_RE.test(val),
        { message: t(lang, 'middleNameNumberError') }
      ),
    last_name: z
      .string()
      .min(1, t(lang, 'lastNameRequiredError'))
      .min(2, t(lang, 'lastNameMinError'))
      .regex(NO_DIGITS_RE, t(lang, 'nameNumberError')),
    role_id: z.string().optional(),
    other_role_title: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (!data.role_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role_id'],
        message: t(lang, 'roleRequiredError'),
      });
    }
    if (data.role_id === 'other' && !data.other_role_title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['other_role_title'],
        message: t(lang, 'otherRoleRequiredError'),
      });
    }
  });
}

export const staticFormSchema = createStaticFormSchema('en');

/**
 * Validates cross-field business rules for dynamic campaign fields.
 * Returns a map of field id → error message for any violations found.
 * Only validates fields that are present in the submitted values.
 */
export function validateBusinessRules(
  fields: FormField[],
  values: Record<number, unknown>,
  lang: LangCode = 'en'
): Record<number, string> {
  const errors: Record<number, string> = {};

  const keyToId: Record<string, number> = {};
  for (const f of fields) {
    keyToId[f.field_key] = f.id;
  }

  const getNum = (key: string): number | null => {
    const id = keyToId[key];
    if (id === undefined) return null;
    const v = values[id];
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const age = getNum('age');
  const exp = getNum('experience_years');
  const salary = getNum('expected_salary');

  if (age !== null && (age < 18 || age > 60)) {
    errors[keyToId['age']] = t(lang, 'ageRangeError');
  }

  if (exp !== null && age !== null && !errors[keyToId['age']]) {
    if (exp > age - 14) {
      errors[keyToId['experience_years']] = t(lang, 'experienceAgeError');
    }
  }

  if (salary !== null && salary > 500000) {
    errors[keyToId['expected_salary']] = t(lang, 'salaryMaxError');
  }

  const joiningId = keyToId['joining_availability'];
  if (joiningId !== undefined) {
    const joiningRaw = values[joiningId];
    if (joiningRaw && typeof joiningRaw === 'string' && joiningRaw !== '') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const joining = new Date(joiningRaw);
      if (!isNaN(joining.getTime()) && joining < today) {
        errors[joiningId] = t(lang, 'joiningPastError');
      }
    }
  }

  return errors;
}

export type StaticFormValues = z.infer<ReturnType<typeof createStaticFormSchema>>;

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
