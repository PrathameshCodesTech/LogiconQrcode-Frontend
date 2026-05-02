import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Loader2, Phone } from 'lucide-react';
import axios from 'axios';

import { getCampaign } from '../api/campaign';
import { createSubmission } from '../api/submissions';
import type { Campaign, FormField } from '../types/campaign';
import type { AnswerPayload, SubmissionError } from '../types/submission';
import { createStaticFormSchema, type StaticFormValues, validateFile, validateBusinessRules } from '../utils/validation';
import { t, type LangCode } from '../utils/i18n';
import FormFieldRenderer from '../components/FormFieldRenderer';
import FileUploadField from '../components/FileUploadField';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SuccessState from '../components/SuccessState';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

const MAX_OTHER_DOCS = 3;

function getFieldLabel(field: FormField, lang: LangCode): string {
  if (lang !== 'en' && field.translations?.[lang]?.label) {
    return field.translations[lang].label!;
  }
  return field.label;
}

function getFieldHelpText(field: FormField, lang: LangCode): string | undefined {
  if (lang !== 'en' && field.translations?.[lang]?.help_text) {
    return field.translations[lang].help_text;
  }
  return field.help_text || undefined;
}

function getFieldOptions(field: FormField, lang: LangCode): string[] {
  if (lang !== 'en' && field.translations?.[lang]?.options?.length) {
    return field.translations[lang].options!;
  }
  return field.options ?? [];
}

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedLang, setSelectedLang] = useState<LangCode>('en');

  const [fieldValues, setFieldValues] = useState<Record<number, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  const [resume, setResume] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [otherDocs, setOtherDocs] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StaticFormValues>({
    resolver: zodResolver(createStaticFormSchema(selectedLang)),
    defaultValues: {
      mobile_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      role_id: '',
      other_role_title: '',
    },
  });

  const selectedRoleId = watch('role_id');

  useEffect(() => {
    if (!token) {
      setLoadError('No campaign token found in this URL.');
      setLoading(false);
      return;
    }
    getCampaign(token)
      .then((data) => {
        setCampaign(data);
        const defaultLang = (data.default_language ?? 'en') as LangCode;
        setSelectedLang(defaultLang);
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setLoadError(t('en', 'errorInvalidLink'));
        } else {
          setLoadError(t('en', 'errorLoading'));
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const activeRoleFields: FormField[] =
    selectedRoleId && campaign?.role_fields[selectedRoleId]
      ? campaign.role_fields[selectedRoleId]
      : [];

  const setField = (id: number, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validateFileInput = (file: File | null, key: string): boolean => {
    if (!file) return true;
    const err = validateFile(file);
    if (err) {
      setFileErrors((prev) => ({ ...prev, [key]: err }));
      return false;
    }
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return true;
  };

  const totalFiles =
    (resume ? 1 : 0) +
    (idProof ? 1 : 0) +
    (certificate ? 1 : 0) +
    otherDocs.length;

  const onSubmit = async (data: StaticFormValues) => {
    if (submitting || !campaign) return;

    // Resume is mandatory
    if (!resume) {
      setFileErrors((prev) => ({
        ...prev,
        resume: t(selectedLang, 'resumeRequiredError'),
      }));
      return;
    }

    const fileChecks = [
      validateFileInput(resume, 'resume'),
      validateFileInput(idProof, 'id_proof'),
      validateFileInput(certificate, 'certificate'),
    ];
    if (fileChecks.some((ok) => !ok)) return;

    if (totalFiles > 5) {
      setFileErrors((prev) => ({
        ...prev,
        other: 'Maximum 5 files total allowed.',
      }));
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    const allFields = [
      ...(campaign.common_fields ?? []),
      ...activeRoleFields,
    ];

    // Business-rule validation (age range, experience vs age, salary cap, joining date)
    const businessErrors = validateBusinessRules(allFields, fieldValues, selectedLang);
    if (Object.keys(businessErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...businessErrors }));
      return;
    }

    const answers: AnswerPayload[] = allFields
      .filter((f) => {
        const val = fieldValues[f.id];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      })
      .map((f) => ({ field_id: f.id, value: fieldValues[f.id] }));

    const formData = new FormData();
    formData.append('campaign_token', token!);
    formData.append('mobile_number', data.mobile_number);
    formData.append('first_name', data.first_name ?? '');
    formData.append('middle_name', data.middle_name ?? '');
    formData.append('last_name', data.last_name ?? '');
    if (data.role_id && data.role_id !== 'other') formData.append('role_id', data.role_id);
    if (data.other_role_title) formData.append('other_role_title', data.other_role_title);
    formData.append('language', selectedLang);
    formData.append('answers', JSON.stringify(answers));
    if (resume) formData.append('resume', resume);
    if (idProof) formData.append('id_proof', idProof);
    if (certificate) formData.append('certificate', certificate);
    otherDocs.forEach((doc) => formData.append('documents', doc));

    try {
      const result = await createSubmission(formData);
      setIsDuplicate(result.is_possible_duplicate);
      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data as SubmissionError;
        const messages = Object.values(errData)
          .flat()
          .filter(Boolean)
          .join(' ');
        setSubmitError(messages || 'Submission failed. Please check your inputs and try again.');
      } else {
        setSubmitError('Could not submit. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} />;
  if (!campaign) return <ErrorState message="Campaign data unavailable." />;
  if (submitted) return <SuccessState isDuplicate={isDuplicate} campaignTitle={campaign.title} lang={selectedLang} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-5">
          {/* Top row: logo + title + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo imageClassName="h-10 w-auto shrink-0 sm:h-12" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold leading-tight text-slate-950 dark:text-slate-100 sm:text-xl">
                  Logicon Facility Management
                </h1>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">
                  {campaign.title}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 sm:ml-auto sm:justify-end">
              {campaign.enabled_languages.length > 1 && (
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {campaign.languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLang(lang.code as LangCode)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        selectedLang === lang.code
                          ? 'bg-blue-900 text-white dark:bg-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {lang.native_label}
                    </button>
                  ))}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-2 sm:pb-10 sm:pt-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">

            {/* Contact Details */}
            <section className="py-6">
              <div className="mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-900 dark:text-blue-300" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t(selectedLang, 'contactDetails')}
                </h2>
              </div>
              <div className="space-y-4">

                {/* Mobile */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(selectedLang, 'mobileNumberRequired')}
                  </label>
                  <div className="flex rounded-lg border bg-white dark:bg-slate-900">
                    <span className="flex shrink-0 items-center gap-1 border-r border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder={t(selectedLang, 'mobilePlaceholder')}
                      autoComplete="tel"
                      className={`min-h-[44px] flex-1 rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100 ${
                        errors.mobile_number
                          ? 'bg-red-50 dark:bg-red-950/30'
                          : ''
                      }`}
                      {...register('mobile_number', {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        },
                      })}
                    />
                  </div>
                  {errors.mobile_number && (
                    <p className="text-xs text-red-600">{errors.mobile_number.message}</p>
                  )}
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium leading-tight text-slate-700 dark:text-slate-200">
                      {t(selectedLang, 'firstNameRequired')}
                    </label>
                    <input
                      type="text"
                      placeholder={t(selectedLang, 'firstNamePlaceholder')}
                      autoComplete="given-name"
                      className={`min-h-[44px] w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 ${
                        errors.first_name
                          ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      {...register('first_name')}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t(selectedLang, 'middleName')}
                    </label>
                    <input
                      type="text"
                      placeholder={t(selectedLang, 'middleNamePlaceholder')}
                      autoComplete="additional-name"
                      className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      {...register('middle_name')}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t(selectedLang, 'lastNameRequired')}
                    </label>
                    <input
                      type="text"
                      placeholder={t(selectedLang, 'lastNamePlaceholder')}
                      autoComplete="family-name"
                      className={`min-h-[44px] w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 ${
                        errors.last_name
                          ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      {...register('last_name')}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Role Selection */}
            {campaign.roles.length > 0 && (
              <section className="py-6">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-900 dark:text-blue-300" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t(selectedLang, 'applyingFor')}
                  </h2>
                </div>
                <div className="space-y-3">
                  {campaign.roles.map((role) => {
                    const selected = selectedRoleId === String(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={String(role.id)}
                          {...register('role_id')}
                        />
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {selected && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        <span className={`text-sm font-medium ${selected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {role.name}
                        </span>
                      </label>
                    );
                  })}

                  {/* Other role option */}
                  <label
                    className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      selectedRoleId === 'other'
                        ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value="other"
                      {...register('role_id')}
                    />
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedRoleId === 'other' ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {selectedRoleId === 'other' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                    <span className={`text-sm font-medium ${selectedRoleId === 'other' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {t(selectedLang, 'other')}
                    </span>
                  </label>
                </div>
                {errors.role_id && (
                  <p className="mt-2 text-xs text-red-600">{errors.role_id.message}</p>
                )}

                {/* Other role text input */}
                {selectedRoleId === 'other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder={t(selectedLang, 'otherRolePlaceholder')}
                      autoComplete="off"
                      className={`min-h-[44px] w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 ${
                        errors.other_role_title
                          ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      {...register('other_role_title')}
                    />
                    {errors.other_role_title && (
                      <p className="mt-1 text-xs text-red-600">{errors.other_role_title.message}</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Common Fields */}
            {campaign.common_fields.length > 0 && (
              <section className="py-6">
                <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t(selectedLang, 'generalInformation')}
                </h2>
                <div className="space-y-4">
                  {campaign.common_fields.map((field) => (
                    <FormFieldRenderer
                      key={field.id}
                      field={field}
                      value={fieldValues[field.id]}
                      onChange={(val) => setField(field.id, val)}
                      error={fieldErrors[field.id]}
                      lang={selectedLang}
                      translatedLabel={getFieldLabel(field, selectedLang)}
                      translatedHelpText={getFieldHelpText(field, selectedLang)}
                      translatedOptions={getFieldOptions(field, selectedLang)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Role-specific Fields */}
            {activeRoleFields.length > 0 && (
              <section className="py-6">
                <h2 className="mb-4 text-sm font-semibold text-blue-900 dark:text-blue-300">
                  {campaign.roles.find((r) => String(r.id) === selectedRoleId)?.name} - {t(selectedLang, 'additionalDetails')}
                </h2>
                <div className="space-y-4">
                  {activeRoleFields.map((field) => (
                    <FormFieldRenderer
                      key={field.id}
                      field={field}
                      value={fieldValues[field.id]}
                      onChange={(val) => setField(field.id, val)}
                      error={fieldErrors[field.id]}
                      lang={selectedLang}
                      translatedLabel={getFieldLabel(field, selectedLang)}
                      translatedHelpText={getFieldHelpText(field, selectedLang)}
                      translatedOptions={getFieldOptions(field, selectedLang)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            <section className="py-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(selectedLang, 'documents')}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t(selectedLang, 'documentsHint')}
                </p>
              </div>
              <div className="space-y-4">
                <FileUploadField
                  label={t(selectedLang, 'resumeRequired')}
                  file={resume}
                  onChange={(f) => {
                    setResume(f);
                    if (f) {
                      setFileErrors((prev) => { const n = { ...prev }; delete n.resume; return n; });
                    }
                    validateFileInput(f, 'resume');
                  }}
                  error={fileErrors.resume}
                />
                <FileUploadField
                  label={t(selectedLang, 'idProof')}
                  file={idProof}
                  onChange={(f) => { setIdProof(f); validateFileInput(f, 'id_proof'); }}
                  error={fileErrors.id_proof}
                />
                <FileUploadField
                  label={t(selectedLang, 'certificate')}
                  file={certificate}
                  onChange={(f) => { setCertificate(f); validateFileInput(f, 'certificate'); }}
                  error={fileErrors.certificate}
                />
                <FileUploadField
                  label={`${t(selectedLang, 'otherDocuments')} (${otherDocs.length}/${MAX_OTHER_DOCS})`}
                  multiple
                  files={otherDocs}
                  onChange={() => {}}
                  onMultiChange={(files) => {
                    const capped = files.slice(0, MAX_OTHER_DOCS);
                    setOtherDocs(capped);
                    if (capped.length + (resume ? 1 : 0) + (idProof ? 1 : 0) + (certificate ? 1 : 0) > 5) {
                      setFileErrors((prev) => ({ ...prev, other: 'Maximum 5 files total allowed.' }));
                    } else {
                      setFileErrors((prev) => { const n = { ...prev }; delete n.other; return n; });
                    }
                  }}
                  error={fileErrors.other}
                  hint={t(selectedLang, 'selectMultipleFiles')}
                />
              </div>
            </section>

            {/* Submit Error */}
            {submitError && (
              <div className="my-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {submitError}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:dark:bg-transparent">
            <button
              type="submit"
              disabled={submitting}
              className="mx-auto flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-blue-900 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:bg-blue-300 sm:max-w-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t(selectedLang, 'submitting')}
                </>
              ) : (
                t(selectedLang, 'submitApplication')
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
