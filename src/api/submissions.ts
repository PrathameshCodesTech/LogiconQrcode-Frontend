import type { SubmissionResponse } from '../types/submission';
import apiClient from './client';

export async function createSubmission(formData: FormData): Promise<SubmissionResponse> {
  const { data } = await apiClient.post<SubmissionResponse>('/public/submissions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
