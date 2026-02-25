-- Seed events with a simpler query
INSERT INTO events (program_id, title, description, event_type, location, starts_at, ends_at, is_public, rsvp_enabled)
SELECT p.id, e.title, e.description, e.event_type::event_type, e.location, e.starts_at, e.ends_at, true, e.rsvp
FROM programs p
CROSS JOIN (
  VALUES
    ('cub-scouts', 'Den Meeting — October', 'Regular weekly den meeting. Bring your handbook.', 'meeting', 'Pathfinder Lodge Room A', NOW() + interval '3 days', NOW() + interval '3 days 2 hours', true),
    ('cub-scouts', 'Pack Campout — Fall', 'Two-night family campout at Cedar Lake.', 'campout', 'Cedar Lake Campground', NOW() + interval '10 days', NOW() + interval '12 days', true),
    ('cub-scouts', 'Pinewood Derby Practice', 'Practice runs before the big race. Bring your car.', 'meeting', 'Pathfinder Gymnasium', NOW() + interval '5 days', NOW() + interval '5 days 2 hours', false),
    ('cub-scouts', 'Blue & Gold Banquet', 'Annual celebration dinner. Families welcome.', 'ceremony', 'Pathfinder Main Hall', NOW() + interval '20 days', NOW() + interval '20 days 3 hours', true),
    ('boy-scouts', 'Troop Meeting', 'Regular Tuesday troop meeting.', 'meeting', 'Pathfinder Lodge Room B', NOW() + interval '2 days', NOW() + interval '2 days 2 hours', false),
    ('boy-scouts', 'Fall Backpacking Trip', '3-day backcountry trip in the national forest.', 'trip', 'Ozark National Forest', NOW() + interval '14 days', NOW() + interval '17 days', true),
    ('boy-scouts', 'Eagle Scout Court of Honor', 'Congratulations to three new Eagle Scouts!', 'ceremony', 'Pathfinder Main Hall', NOW() + interval '25 days', NOW() + interval '25 days 2 hours', false),
    ('boy-scouts', 'Merit Badge Fair', 'Work on multiple merit badges in one weekend.', 'meeting', 'Pathfinder Complex', NOW() + interval '8 days', NOW() + interval '9 days', true),
    ('rangers', 'Land Navigation Training', 'Map & compass field exercise. Long pants required.', 'meeting', 'Pathfinder East Field', NOW() + interval '4 days', NOW() + interval '4 days 4 hours', false),
    ('rangers', '7-Day Backcountry Expedition', 'High-adventure wilderness expedition. Permit required.', 'trip', 'Ouachita Trail, AR', NOW() + interval '30 days', NOW() + interval '37 days', true),
    ('rangers', 'First Aid Certification Course', 'NOLS Wilderness First Aid — 2-day cert course.', 'meeting', 'Pathfinder Training Room', NOW() + interval '12 days', NOW() + interval '13 days', true),
    ('squadron', 'Ground School Session', 'Flight principles and weather basics.', 'meeting', 'Pathfinder Aviation Room', NOW() + interval '1 day', NOW() + interval '1 day 2 hours', false),
    ('squadron', 'Airport Tour — Regional Airport', 'Behind-the-scenes tour with ATC visit.', 'trip', 'Regional Airport', NOW() + interval '15 days', NOW() + interval '15 days 4 hours', true),
    ('squadron', 'Rocketry Build Day', 'Build and prep rockets for launch day.', 'meeting', 'Pathfinder Outdoor Pad', NOW() + interval '6 days', NOW() + interval '6 days 3 hours', true),
    ('squadron', 'Model Rocket Launch', 'Launch day! Safety briefing at 9am sharp.', 'competition', 'Pathfinder Launch Field', NOW() + interval '7 days', NOW() + interval '7 days 4 hours', true),
    ('shooting-club', 'Rifle Range Session', 'Supervised .22 rifle practice. Ear/eye pro required.', 'meeting', 'Cedar Range, Bay 1-4', NOW() + interval '2 days', NOW() + interval '2 days 3 hours', true),
    ('shooting-club', 'Archery Practice', 'Open archery practice for all skill levels.', 'meeting', 'Cedar Archery Range', NOW() + interval '5 days', NOW() + interval '5 days 2 hours', false),
    ('shooting-club', 'State Competition Qualifier', 'Team selection shoot for state-level competition.', 'competition', 'Cedar Range, Full Course', NOW() + interval '18 days', NOW() + interval '18 days 4 hours', true),
    ('shooting-club', 'NRA Safety Course', 'Required safety course for new members. Ages 10+.', 'meeting', 'Pathfinder Training Room', NOW() + interval '9 days', NOW() + interval '9 days 3 hours', true)
) AS e(prog_slug, title, description, event_type, location, starts_at, ends_at, rsvp)
WHERE p.slug = e.prog_slug;

-- All-programs event
INSERT INTO events (program_id, title, description, event_type, location, starts_at, ends_at, is_public, rsvp_enabled)
VALUES (null, 'Pathfinder Family Day', 'Annual celebration open to all five programs and their families. Food, demos, and awards.', 'ceremony', 'Pathfinder Main Campus', NOW() + interval '22 days', NOW() + interval '22 days 6 hours', true, true);
