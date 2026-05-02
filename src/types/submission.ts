export interface AnswerPayload {
  field_id: number;
  value: unknown;
}

export interface SubmissionResponse {
  id: number;
  status: string;
  is_possible_duplicate: boolean;
  documents_count?: number;
  message: string;
}

export interface SubmissionError {
  detail?: string;
  mobile_number?: string[];
  campaign_token?: string[];
  non_field_errors?: string[];
  [key: string]: string[] | string | undefined;
}
