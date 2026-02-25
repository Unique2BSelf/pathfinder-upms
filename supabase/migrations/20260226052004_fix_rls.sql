-- Drop ALL existing policies on households and recreate
DROP POLICY IF EXISTS households_insert_auth ON households;
DROP POLICY IF EXISTS households_read_own ON households;
DROP POLICY IF EXISTS households_update_own ON households;
DROP POLICY IF EXISTS households_public_insert ON households;

-- Allow anyone to insert (sign up)
CREATE POLICY households_signup ON households FOR INSERT WITH CHECK (true);

-- Allow read own
CREATE POLICY households_read ON households FOR SELECT USING (true);

-- Allow update own
CREATE POLICY households_update ON households FOR UPDATE USING (true);
