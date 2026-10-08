export type UIFieldType =
  | 'number'
  | 'text'
  | 'select'
  | 'combobox'
  | 'textbox'
  | 'button'
  | 'checkbox'
  | 'note'
  | (string & {});

export interface UIFieldSchema {
  key: string;
  label?: string | null;
  ui_type: UIFieldType;
  default?: any;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  unit?: string | null;
  container?: string | null;
  container_title?: string;
  group?: string | null;
  show_group_title?: boolean;
  options?: string[];
  placeholder?: string | null;
  placeholder_dynamic?: string;
  required?: boolean;
  action?: string | null;
  button_label?: string;
  is_material_field?: boolean;
  member_type?: string;
  visibility?: boolean;
  validator?: string | null;
  post_row?: {
    kind: string;
    icon?: string;
  };
  disabled_options?: string[];
  note?: string;
}

export interface ValidateFieldRequest {
  key: string;
  value: any;
  all_inputs?: Record<string, any>;
}

export interface ValidateFieldResponse {
  valid: boolean;
  corrected_value?: any;
  message?: string | null;
}

export interface BackendValidationResponse {
  status?: boolean;
  is_valid?: boolean;
  valid?: boolean;
  errors?: Record<string, string> | string[];
  message?: string;
  corrected_values?: Record<string, any>;
}

