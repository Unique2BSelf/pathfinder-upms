ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'household_info';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
