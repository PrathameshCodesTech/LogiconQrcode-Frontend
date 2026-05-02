export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type SubmissionStatus =
  | 'new'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected'
  | 'contacted'
  | 'hired'
  | 'duplicate';

export interface SubmissionListItem {
  id: number;
  mobile_number: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  campaign_title: string;
  role_name: string | null;
  other_role_title: string;
  applied_role_display: string;
  site_name: string | null;
  status: SubmissionStatus;
  language: string;
  is_possible_duplicate: boolean;
  submitted_at: string;
  same_mobile_campaign_count: number;
  has_other_applications: boolean;
}

export interface SubmissionAnswer {
  id: number;
  field: number | null;
  field_label_snapshot: string;
  field_type_snapshot: string;
  value: unknown;
  created_at: string;
}

export interface SubmissionDocument {
  id: number;
  submission: number;
  field: number | null;
  document_type: string;
  file: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface SubmissionReview {
  id: number;
  old_status: string;
  new_status: string;
  note: string;
  reviewed_by_name: string | null;
  created_at: string;
}

export interface OtherApplication {
  id: number;
  full_name: string;
  mobile_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  role_name: string | null;
  other_role_title: string;
  applied_role_display: string;
  status: SubmissionStatus;
  is_possible_duplicate: boolean;
  submitted_at: string;
}

export interface SubmissionDetail {
  id: number;
  mobile_number: string;
  mobile_number_normalized: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  other_role_title: string;
  applied_role_display: string;
  status: SubmissionStatus;
  language: string;
  is_possible_duplicate: boolean;
  duplicate_reason: string;
  submitted_at: string;
  updated_at: string;
  campaign_title: string;
  role_name: string | null;
  site_name: string | null;
  ip_address: string | null;
  user_agent: string;
  answers: SubmissionAnswer[];
  documents: SubmissionDocument[];
  reviews: SubmissionReview[];
  other_applications: OtherApplication[];
}

export interface AdminCampaign {
  id: number;
  title: string;
  token: string;
  organization: number;
  site: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  shuffle_fields: boolean;
  requires_otp: boolean;
  allow_duplicates: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFilters {
  page?: number;
  status?: string;
  search?: string;
  role_id?: string;
  role_filter?: string;
  campaign_id?: string;
  site_id?: string;
  mobile_number?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
}
