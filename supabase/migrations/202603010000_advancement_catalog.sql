-- Advancement Catalog: The brain that knows all requirements
-- Supports hierarchical structure: Ranks → Adventure/Requirements → Sub-requirements

CREATE TABLE IF NOT EXISTS advancement_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    program VARCHAR(20) NOT NULL CHECK (program IN ('cub', 'boy')),
    type VARCHAR(30) NOT NULL CHECK (type IN ('rank', 'merit_badge', 'adventure', 'requirement')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES advancement_catalog(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    eagle_required BOOLEAN DEFAULT false,
    months_requirement INTEGER, -- For Star/Life/Eagle leadership time
    hours_requirement INTEGER, -- For service hour requirements
    nights_requirement INTEGER, -- For camping requirements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scout Progress: Tracks each youth's advancement
CREATE TABLE IF NOT EXISTS scout_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES advancement_catalog(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'in_progress', 'provisional', 'verified', 'awarded')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    signed_off_by UUID REFERENCES users(id),
    signed_off_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(youth_member_id, requirement_id)
);

-- Service Log: Tracks service hours
CREATE TABLE IF NOT EXISTS service_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    hours DECIMAL(5,2) NOT NULL,
    service_date DATE NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Camping Log: Tracks nights camping
CREATE TABLE IF NOT EXISTS camping_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    nights_count INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leadership Log: Tracks time in leadership roles
CREATE TABLE IF NOT EXISTS leadership_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- SPL, ASPL, PL, Scribe, Quartermaster, etc.
    patrol_id UUID, -- Optional: link to specific patrol
    start_date DATE NOT NULL,
    end_date DATE,
    months_count INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_date IS NOT NULL THEN EXTRACT(MONTH FROM age(end_date, start_date))
            ELSE EXTRACT(MONTH FROM age(CURRENT_DATE, start_date))
        END
    ) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patrols/Den Management
CREATE TABLE IF NOT EXISTS patrols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program VARCHAR(20) NOT NULL CHECK (program IN ('cub', 'boy')),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('patrol', 'den')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patrol Assignments
CREATE TABLE IF NOT EXISTS patrol_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    role VARCHAR(50), -- Leader, Assistant, Member
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(youth_member_id, patrol_id)
);

-- Indexes
CREATE INDEX idx_advancement_catalog_program ON advancement_catalog(program);
CREATE INDEX idx_advancement_catalog_type ON advancement_catalog(type);
CREATE INDEX idx_advancement_catalog_parent ON advancement_catalog(parent_id);
CREATE INDEX idx_scout_progress_youth ON scout_progress(youth_member_id);
CREATE INDEX idx_scout_progress_status ON scout_progress(status);
CREATE INDEX idx_scout_progress_requirement ON scout_progress(requirement_id);
CREATE INDEX idx_service_log_youth ON service_log(youth_member_id);
CREATE INDEX idx_camping_log_youth ON camping_log(youth_member_id);
CREATE INDEX idx_leadership_log_youth ON leadership_log(youth_member_id);
CREATE INDEX idx_patrol_assignments_patrol ON patrol_assignments(patrol_id);
