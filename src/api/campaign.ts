import type { Campaign } from '../types/campaign';
import apiClient from './client';

export async function getCampaign(token: string): Promise<Campaign> {
  const { data } = await apiClient.get<Campaign>(`/public/campaigns/${token}/`);
  return data;
}
