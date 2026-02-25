-- Registration fields and program waivers
CREATE TABLE IF NOT EXISTS registration_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT DEFAULT 'text',
  required BOOLEAN DEFAULT false,
  options TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id)
);

-- RLS
ALTER TABLE registration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage registration_fields" ON registration_fields FOR ALL USING (true);
CREATE POLICY "Admins can manage program_waivers" ON program_waivers FOR ALL USING (true);
