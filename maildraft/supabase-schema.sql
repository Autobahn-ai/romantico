-- MailDraft Database Schema
-- Run this in your Supabase SQL Editor

-- Teams
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP DEFAULT now()
);

-- Templates
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject_line TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Template blocks (parts A, B, C, D...)
CREATE TABLE template_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Options within each block
CREATE TABLE block_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID REFERENCES template_blocks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  body_text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Attachments linked to an option (Google Drive files)
CREATE TABLE option_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID REFERENCES block_options(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  google_drive_file_id TEXT NOT NULL,
  google_drive_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Global template variables ({nombre}, {fecha}, {empresa})
CREATE TABLE template_variables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  auto_fill_type TEXT CHECK (auto_fill_type IN ('manual', 'recipient_name', 'today_date', 'sender_name', 'custom')),
  default_value TEXT
);

-- Indexes
CREATE INDEX idx_template_blocks_template ON template_blocks(template_id);
CREATE INDEX idx_block_options_block ON block_options(block_id);
CREATE INDEX idx_option_attachments_option ON option_attachments(option_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);

-- Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;

-- Policies: team members can view their team's templates
CREATE POLICY "Team members can view their templates" ON templates
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team admins can insert templates" ON templates
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Team admins can update templates" ON templates
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Team admins can delete templates" ON templates
  FOR DELETE USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Blocks follow template access
CREATE POLICY "View blocks via template" ON template_blocks
  FOR SELECT USING (
    template_id IN (SELECT id FROM templates WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Manage blocks via template" ON template_blocks
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Options follow block access
CREATE POLICY "View options via block" ON block_options
  FOR SELECT USING (
    block_id IN (SELECT id FROM template_blocks WHERE template_id IN (
      SELECT id FROM templates WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Manage options via block" ON block_options
  FOR ALL USING (
    block_id IN (SELECT id FROM template_blocks WHERE template_id IN (
      SELECT id FROM templates WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
      )
    ))
  );

-- Attachments follow option access
CREATE POLICY "View attachments via option" ON option_attachments
  FOR SELECT USING (
    option_id IN (SELECT id FROM block_options WHERE block_id IN (
      SELECT id FROM template_blocks WHERE template_id IN (
        SELECT id FROM templates WHERE team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Manage attachments via option" ON option_attachments
  FOR ALL USING (
    option_id IN (SELECT id FROM block_options WHERE block_id IN (
      SELECT id FROM template_blocks WHERE template_id IN (
        SELECT id FROM templates WHERE team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    ))
  );

-- Variables follow template access
CREATE POLICY "View variables via template" ON template_variables
  FOR SELECT USING (
    template_id IN (SELECT id FROM templates WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Manage variables via template" ON template_variables
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Team members can view their own team
CREATE POLICY "View own team" ON team_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "View team info" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
