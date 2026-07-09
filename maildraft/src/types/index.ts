export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Template {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  subject_line: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template_blocks?: TemplateBlock[];
  template_variables?: TemplateVariable[];
}

export interface TemplateBlock {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  is_required: boolean;
  created_at: string;
  block_options?: BlockOption[];
}

export interface BlockOption {
  id: string;
  block_id: string;
  label: string;
  body_text: string;
  position: number;
  created_at: string;
  option_attachments?: OptionAttachment[];
}

export interface OptionAttachment {
  id: string;
  option_id: string;
  file_name: string;
  google_drive_file_id: string;
  google_drive_url: string;
  mime_type: string | null;
  created_at: string;
}

export interface TemplateVariable {
  id: string;
  template_id: string;
  variable_name: string;
  auto_fill_type: 'manual' | 'recipient_name' | 'today_date' | 'sender_name' | 'custom';
  default_value: string | null;
}

// Draft types used in the builder before saving to DB
export interface DraftOption {
  id: string;
  label: string;
  body_text: string;
  position: number;
  attachments: DraftAttachment[];
}

export interface DraftAttachment {
  id: string;
  file_name: string;
  google_drive_file_id: string;
  google_drive_url: string;
  mime_type: string;
}

export interface DraftBlock {
  id: string;
  name: string;
  description: string;
  position: number;
  is_required: boolean;
  options: DraftOption[];
}

export interface DraftVariable {
  id: string;
  variable_name: string;
  auto_fill_type: 'manual' | 'recipient_name' | 'today_date' | 'sender_name' | 'custom';
  default_value: string;
}

export interface DraftTemplate {
  name: string;
  description: string;
  subject_line: string;
  variables: DraftVariable[];
  blocks: DraftBlock[];
}
