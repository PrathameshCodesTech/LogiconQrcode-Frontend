export interface Site {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'email'
  | 'select'
  | 'multi_select'
  | 'boolean'
  | 'file';

export interface FormFieldTranslation {
  label?: string;
  help_text?: string;
  options?: string[];
}

export interface FormField {
  id: number;
  label: string;
  field_key: string;
  field_type: FieldType;
  help_text: string;
  placeholder: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  min_length: number | null;
  max_length: number | null;
  min_value: string | null;
  max_value: string | null;
  role: number | null;
  translations?: Record<string, FormFieldTranslation>;
}

export interface CampaignSettings {
  shuffle_fields: boolean;
  requires_otp: boolean;
  allow_duplicates: boolean;
}

export interface CampaignLanguage {
  code: string;
  label: string;
  native_label: string;
}

export interface Campaign {
  id: number;
  title: string;
  token: string;
  site: Site | null;
  roles: Role[];
  common_fields: FormField[];
  role_fields: Record<string, FormField[]>;
  settings: CampaignSettings;
  default_language: string;
  enabled_languages: string[];
  languages: CampaignLanguage[];
}
