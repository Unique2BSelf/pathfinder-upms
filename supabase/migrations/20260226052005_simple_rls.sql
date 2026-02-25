DROP POLICY IF EXISTS households_insert_auth ON households;
DROP POLICY IF EXISTS households_read_own ON households;
DROP POLICY IF EXISTS households_update_own ON households;
DROP POLICY IF EXISTS households_public_insert ON households;
DROP POLICY IF EXISTS households_signup ON households;
DROP POLICY IF EXISTS households_read ON households;
DROP POLICY IF EXISTS households_update ON households;
CREATE POLICY allow_all_households ON households FOR ALL USING (true) WITH CHECK (true);
