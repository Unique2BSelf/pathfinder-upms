-- Rank Completion Logic

-- Function to check if a youth has completed all requirements for a rank
CREATE OR REPLACE FUNCTION check_rank_completion(p_youth_id UUID, p_rank_id UUID)
RETURNS TABLE (
  is_complete BOOLEAN,
  completed_count INTEGER,
  required_count INTEGER,
  next_rank_id UUID,
  next_rank_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS 1904
DECLARE
  v_required_count INTEGER;
  v_completed_count INTEGER;
  v_is_complete BOOLEAN := false;
  v_next_rank_id UUID;
  v_next_rank_name TEXT;
BEGIN
  -- Get total required for this rank
  SELECT COUNT(*)::INTEGER INTO v_required_count
  FROM advancement_catalog
  WHERE parent_id = p_rank_id
  AND is_required = true;

  -- Get completed count
  SELECT COUNT(*)::INTEGER INTO v_completed_count
  FROM scout_progress sp
  JOIN advancement_catalog ac ON ac.id = sp.requirement_id
  WHERE sp.youth_member_id = p_youth_id
  AND ac.parent_id = p_rank_id
  AND sp.status IN ('verified', 'awarded');

  -- Check if complete
  IF v_completed_count >= v_required_count AND v_required_count > 0 THEN
    v_is_complete := true;
  END IF;

  -- Get next rank
  SELECT id, name INTO v_next_rank_id, v_next_rank_name
  FROM advancement_catalog
  WHERE type = 'rank'
  AND program = (SELECT program FROM advancement_catalog WHERE id = p_rank_id)
  AND display_order > (SELECT display_order FROM advancement_catalog WHERE id = p_rank_id)
  ORDER BY display_order
  LIMIT 1;

  RETURN QUERY SELECT v_is_complete, v_completed_count, v_required_count, v_next_rank_id, v_next_rank_name;
END;
1904;

-- Function to process rank completion and create alerts
CREATE OR REPLACE FUNCTION process_rank_completion(p_youth_id UUID, p_rank_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS 1904
DECLARE
  v_rank RECORD;
  v_youth RECORD;
  v_result RECORD;
  v_already_awarded BOOLEAN;
BEGIN
  -- Get rank info
  SELECT * INTO v_rank FROM advancement_catalog WHERE id = p_rank_id;
  
  -- Get youth info
  SELECT * INTO v_youth FROM youth_members WHERE id = p_youth_id;
  
  -- Check if already awarded this rank
  SELECT EXISTS(
    SELECT 1 FROM scout_progress sp
    JOIN advancement_catalog ac ON ac.id = sp.requirement_id
    WHERE sp.youth_member_id = p_youth_id
    AND ac.parent_id = p_rank_id
    AND sp.status = 'awarded'
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN false;
  END IF;

  -- Check completion
  SELECT * INTO v_result FROM check_rank_completion(p_youth_id, p_rank_id);

  IF v_result.is_complete THEN
    -- Update youth rank_level
    UPDATE youth_members 
    SET rank_level = v_rank.slug
    WHERE id = p_youth_id;

    -- Create admin alert
    INSERT INTO admin_alerts (type, title, description, priority, status)
    VALUES (
      'advancement',
      format('Advancement: %s has completed %s!', 
        COALESCE(v_youth.preferred_name, v_youth.first_name) || ' ' || v_youth.last_name,
        v_rank.name),
      CASE 
        WHEN v_result.next_rank_name IS NOT NULL 
        THEN format('Ready for %s. Great work!', v_result.next_rank_name)
        ELSE 'Congratulations!'
      END,
      'info',
      'unread'
    );

    RETURN true;
  END IF;

  RETURN false;
END;
1904;
