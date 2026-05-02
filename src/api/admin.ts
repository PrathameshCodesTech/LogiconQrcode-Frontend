import axios from 'axios';
import type {
  AdminCampaign,
  PaginatedResponse,
  SubmissionDetail,
  SubmissionFilters,
  SubmissionListItem,
} from '../types/admin';
import { clearTokens, getAccessToken } from '../utils/auth';

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  timeout: 30000,
});

adminClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (r) => r,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearTokens();
      window.location.href = '/horizon-admin/login';
    }
    return Promise.reject(error);
  }
);

export async function getSubmissions(
  params?: SubmissionFilters
): Promise<PaginatedResponse<SubmissionListItem>> {
  const { data } = await adminClient.get<PaginatedResponse<SubmissionListItem>>(
    '/admin/submissions/',
    { params }
  );
  return data;
}

export async function getSubmission(id: number): Promise<SubmissionDetail> {
  const { data } = await adminClient.get<SubmissionDetail>(`/admin/submissions/${id}/`);
  return data;
}

export async function updateSubmissionStatus(
  id: number,
  status: string,
  note?: string
): Promise<{ id: number; status: string }> {
  const { data } = await adminClient.patch<{ id: number; status: string }>(
    `/admin/submissions/${id}/status/`,
    { status, note: note ?? '' }
  );
  return data;
}

export async function getSubmissionResumeUrl(submissionId: number): Promise<string | null> {
  const { data } = await adminClient.get<{ resume_url: string | null }>(
    `/admin/submissions/${submissionId}/resume-url/`
  );
  return data.resume_url;
}

export async function getCampaigns(): Promise<PaginatedResponse<AdminCampaign>> {
  const { data } = await adminClient.get<PaginatedResponse<AdminCampaign>>('/admin/campaigns/');
  return data;
}

export async function downloadQRCode(
  id: number,
  token: string
): Promise<{ blob: Blob; filename: string }> {
  const response = await adminClient.get(`/admin/campaigns/${id}/qrcode/`, {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = `qr_${token.slice(0, 12)}.png`;
  if (disposition) {
    const match = /filename="([^"]+)"/.exec(disposition);
    if (match) filename = match[1];
  }
  return { blob: response.data as Blob, filename };
}

export async function exportSubmissionsExcel(
  filters?: SubmissionFilters
): Promise<void> {
  const params: Record<string, string | number | undefined> = { ...filters };
  delete params.page;

  const response = await adminClient.get('/admin/submissions/export/', {
    params,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = 'logicon_submissions.xlsx';
  if (disposition) {
    const match = /filename="([^"]+)"/.exec(disposition);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
