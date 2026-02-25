-- Storage policies
create policy "documents_owner_access" on storage.objects for select using ( bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1] );
