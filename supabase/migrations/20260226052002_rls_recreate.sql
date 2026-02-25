drop policy if exists households_insert_auth on households;
drop policy if exists households_read_own on households;
drop policy if exists households_update_own on households;

create policy households_public_insert on households for insert with check (auth.role() = 'authenticated');
create policy households_read_own on households for select using (id in (select household_id from users where id = auth.uid()));
create policy households_update_own on households for update using (id in (select household_id from users where id = auth.uid()));
