-- Activity Logging Schema

-- Ensure columns exist in youth_members
ALTER TABLE youth_members ADD COLUMN IF NOT EXISTS rank_level VARCHAR(50);
ALTER TABLE youth_members ADD COLUMN IF NOT EXISTS swimming_level VARCHAR(50);
ALTER TABLE youth_members ADD COLUMN IF NOT EXISTS totin_chip BOOLEAN DEFAULT false;
ALTER TABLE youth_members ADD COLUMN IF NOT EXISTS firem_n_chip BOOLEAN DEFAULT false;

-- Camping Log
CREATE TABLE IF NOT EXISTS camping_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    nights_count INTEGER NOT NULL CHECK (nights_count >= 0),
    is_tent_camping BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Log  
CREATE TABLE IF NOT EXISTS service_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_member_id UUID NOT NULL REFERENCES youth_members(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    hours_count DECIMAL(5,2) NOT NULL CHECK (hours_count >= 0),
    service_date DATE NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_camping_log_youth ON camping_log(youth_member_id);
CREATE INDEX IF NOT EXISTS idx_camping_log_dates ON camping_log(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_service_log_youth ON service_log(youth_member_id);
CREATE INDEX IF NOT EXISTS idx_service_log_date ON service_log(service_date);

-- Function to get scout activity totals
CREATE OR REPLACE FUNCTION get_scout_activity_totals(p_youth_id UUID)
RETURNS TABLE (
    total_nights INTEGER,
    total_service_hours DECIMAL(10,2),
    total_tent_nights INTEGER,
    camping_trip_count INTEGER,
    service_project_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS 2300
DECLARE
    v_total_nights INTEGER := 0;
    v_total_service_hours DECIMAL(10,2) := 0;
    v_total_tent_nights INTEGER := 0;
    v_camping_trip_count INTEGER := 0;
    v_service_project_count INTEGER := 0;
BEGIN
    -- Get camping totals
    SELECT 
        COALESCE(SUM(nights_count), 0),
        COALESCE(SUM(CASE WHEN is_tent_camping THEN nights_count ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_nights, v_total_tent_nights, v_camping_trip_count
    FROM camping_log
    WHERE youth_member_id = p_youth_id;

    -- Get service totals
    SELECT 
        COALESCE(SUM(hours_count), 0),
        COUNT(*)
    INTO v_total_service_hours, v_service_project_count
    FROM service_log
    WHERE youth_member_id = p_youth_id;

    RETURN QUERY SELECT 
        v_total_nights, 
        v_total_service_hours, 
        v_total_tent_nights,
        v_camping_trip_count,
        v_service_project_count;
END;
2300;
