-- =============================================================================
-- Pathfinder UPMS — Calendar Seed Data
-- File: supabase/migrations/002_seed_events.sql
--
-- Run AFTER 001_phase1_schema.sql.
-- Inserts sample events for testing the Mom Page calendar and .ics feeds.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- =============================================================================

-- Grab program IDs into a CTE for readability
with prog as (
  select id, slug from programs
)

insert into events (
  program_id, title, description, event_type, location,
  starts_at, ends_at, is_public, rsvp_enabled
)
select
  p.id,
  ev.title,
  ev.description,
  ev.event_type::event_type,
  ev.location,
  (now() + ev.offset_start)::timestamptz,
  (now() + ev.offset_end)::timestamptz,
  true,
  ev.rsvp
from prog p
join (values
  -- ── Cub Scouts ──────────────────────────────────────────────────────
  ('cub-scouts', 'Den Meeting — October',           'Regular weekly den meeting. Bring your handbook.',   'meeting',     'Pathfinder Lodge Room A', interval '3 days',  interval '3 days 2 hours',  true),
  ('cub-scouts', 'Pack Campout — Fall',             'Two-night family campout at Cedar Lake.',             'campout',     'Cedar Lake Campground',   interval '10 days', interval '12 days',         true),
  ('cub-scouts', 'Pinewood Derby Practice',         'Practice runs before the big race. Bring your car.', 'meeting',     'Pathfinder Gymnasium',    interval '5 days',  interval '5 days 2 hours',  false),
  ('cub-scouts', 'Blue & Gold Banquet',             'Annual celebration dinner. Families welcome.',        'ceremony',    'Pathfinder Main Hall',    interval '20 days', interval '20 days 3 hours', true),

  -- ── Boy Scouts ──────────────────────────────────────────────────────
  ('boy-scouts', 'Troop Meeting',                   'Regular Tuesday troop meeting.',                      'meeting',     'Pathfinder Lodge Room B', interval '2 days',  interval '2 days 2 hours',  false),
  ('boy-scouts', 'Fall Backpacking Trip',           '3-day backcountry trip in the national forest.',      'trip',        'Ozark National Forest',   interval '14 days', interval '17 days',         true),
  ('boy-scouts', 'Eagle Scout Court of Honor',      'Congratulations to three new Eagle Scouts!',          'ceremony',    'Pathfinder Main Hall',    interval '25 days', interval '25 days 2 hours', false),
  ('boy-scouts', 'Merit Badge Fair',                'Work on multiple merit badges in one weekend.',       'meeting',     'Pathfinder Complex',      interval '8 days',  interval '9 days',          true),

  -- ── Rangers ─────────────────────────────────────────────────────────
  ('rangers',    'Land Navigation Training',        'Map & compass field exercise. Long pants required.',  'meeting',     'Pathfinder East Field',   interval '4 days',  interval '4 days 4 hours',  false),
  ('rangers',    '7-Day Backcountry Expedition',    'High-adventure wilderness expedition. Permit required.', 'trip',    'Ouachita Trail, AR',      interval '30 days', interval '37 days',         true),
  ('rangers',    'First Aid Certification Course',  'NOLS Wilderness First Aid — 2-day cert course.',     'meeting',     'Pathfinder Training Room',interval '12 days', interval '13 days',         true),

  -- ── Squadron ────────────────────────────────────────────────────────
  ('squadron',   'Ground School Session',           'Flight principles and weather basics.',               'meeting',     'Pathfinder Aviation Room',interval '1 day',   interval '1 day 2 hours',   false),
  ('squadron',   'Airport Tour — Regional Airport', 'Behind-the-scenes tour with ATC visit.',             'trip',        'Regional Airport',         interval '15 days', interval '15 days 4 hours', true),
  ('squadron',   'Rocketry Build Day',              'Build and prep rockets for launch day.',              'meeting',     'Pathfinder Outdoor Pad',  interval '6 days',  interval '6 days 3 hours',  true),
  ('squadron',   'Model Rocket Launch',             'Launch day! Safety briefing at 9am sharp.',          'competition', 'Pathfinder Launch Field',  interval '7 days',  interval '7 days 4 hours',  true),

  -- ── Shooting Club ────────────────────────────────────────────────────
  ('shooting-club', 'Rifle Range Session',         'Supervised .22 rifle practice. Ear/eye pro required.','meeting',    'Cedar Range, Bay 1-4',    interval '2 days',  interval '2 days 3 hours',  true),
  ('shooting-club', 'Archery Practice',            'Open archery practice for all skill levels.',          'meeting',    'Cedar Archery Range',     interval '5 days',  interval '5 days 2 hours',  false),
  ('shooting-club', 'State Competition Qualifier', 'Team selection shoot for state-level competition.',   'competition', 'Cedar Range, Full Course', interval '18 days', interval '18 days 4 hours', true),
  ('shooting-club', 'NRA Safety Course',           'Required safety course for new members. Ages 10+.',   'meeting',    'Pathfinder Training Room', interval '9 days',  interval '9 days 3 hours',  true)
) as ev(prog_slug, title, description, event_type, location, offset_start, offset_end, rsvp)
  on prog.slug = ev.prog_slug;

-- ── All-programs event ─────────────────────────────────────────────────────
insert into events (
  program_id, title, description, event_type, location,
  starts_at, ends_at, is_public, rsvp_enabled
) values (
  null,
  'Pathfinder Family Day',
  'Annual celebration open to all five programs and their families. Food, demos, and awards.',
  'ceremony',
  'Pathfinder Main Campus',
  (now() + interval '22 days')::timestamptz,
  (now() + interval '22 days 6 hours')::timestamptz,
  true,
  true
);
