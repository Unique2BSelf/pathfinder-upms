-- Seed data for Scout and Tenderfoot ranks (Boy Scouts)

-- Scout Rank
INSERT INTO advancement_catalog (slug, program, type, name, description, display_order, is_required) VALUES
('scout', 'boy', 'rank', 'Scout', 'First rank in Boy Scouts', 1, true),
('tenderfoot', 'boy', 'rank', 'Tenderfoot', 'Second rank in Boy Scouts', 2, true);

-- Scout Requirements (12 requirements)
INSERT INTO advancement_catalog (slug, program, type, name, description, parent_id, display_order, is_required) 
SELECT 
    'scout-req-' || n,
    'boy',
    'requirement',
    'Requirement ' || n,
    CASE n
        WHEN 1 THEN 'Repeat the Scout Oath and Scout Law in order'
        WHEN 2 THEN 'Describe the Scout Sign, Scout Salute, and Scout Spirit'
        WHEN 3 THEN 'Explain the buddy system and its importance'
        WHEN 4 THEN 'Show knowledge of danger signs and first aid'
        WHEN 5 THEN 'Present yourself to your Scoutmaster with a parent or guardian'
        WHEN 6 THEN 'Submit a completed BSA Youth Application'
        WHEN 7 THEN 'Demonstrate the Scout salute and handshake'
        WHEN 8 THEN 'Demonstrate tying the square knot'
        WHEN 9 THEN 'Demonstrate the patrol signs'
        WHEN 10 THEN 'Show understanding of the Outdoor Code'
        WHEN 11 THEN 'Participate in a school service project'
        WHEN 12 THEN 'Learn about Scouts BSA and describe its purpose'
    END,
    (SELECT id FROM advancement_catalog WHERE slug = 'scout'),
    n,
    true
FROM generate_series(1, 12) n;

-- Tenderfoot Rank
INSERT INTO advancement_catalog (slug, program, type, name, description, display_order, is_required, parent_id)
SELECT 
    'tenderfoot',
    'boy',
    'rank',
    'Tenderfoot',
    'Second rank - emphasizes Scout Spirit, service, and outdoor skills',
    2,
    true,
    NULL;

-- Tenderfoot Requirements (14 requirements)
INSERT INTO advancement_catalog (slug, program, type, name, description, parent_id, display_order, is_required) 
SELECT 
    'tenderfoot-req-' || n,
    'boy',
    'requirement',
    'Requirement ' || n,
    CASE n
        WHEN 1 THEN 'Present yourself to your Scoutmaster with a detailed advancement plan'
        WHEN 2 THEN 'Demonstrate the Scout Salute, Handshake, and Sign'
        WHEN 3 THEN 'Demonstrate knowledge of the Scout Law and explain each point'
        WHEN 4 THEN 'Attend a Scoutmaster conference'
        WHEN 5 THEN 'Complete Tenderfoot requirements 6, 7a, 8, 9, and 10'
        WHEN 6 THEN 'Demonstrate proper care of the US Flag'
        WHEN 7 THEN '7a. Demonstrate how to display and fold the flag'
        WHEN 7 THEN '7b. Recite the Pledge of Allegiance'
        WHEN 8 THEN 'Explain what respect and reverence mean in Scouting'
        WHEN 9 THEN 'Complete a service project of at least 1 hour'
        WHEN 10 THEN 'Complete 12 consecutive nights of camping'
        WHEN 11 THEN 'Explain the buddy system and its importance in Scouting'
        WHEN 12 THEN 'Demonstrate first aid for: cuts, scratches, insect bites, bee stings'
        WHEN 13 THEN 'Demonstrate first aid for: blisters, sunburn, minor burns'
        WHEN 14 THEN 'Demonstrate understanding of safety in outdoor activities'
    END,
    (SELECT id FROM advancement_catalog WHERE slug = 'tenderfoot'),
    n,
    true
FROM generate_series(1, 14) n;

-- Note: Some Tenderfoot requirements have sub-letters (7a, 7b) - handled separately
