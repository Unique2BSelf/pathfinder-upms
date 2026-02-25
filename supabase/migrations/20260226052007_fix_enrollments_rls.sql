DROP POLICY IF EXISTS enrollments_read_own ON enrollments;
DROP POLICY IF EXISTS enrollments_insert_own ON enrollments;
CREATE POLICY allow_all_enrollments ON enrollments FOR ALL USING (true) WITH CHECK (true);
