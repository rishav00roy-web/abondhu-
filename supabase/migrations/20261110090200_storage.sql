-- Private file storage (Supabase Storage). Skipped automatically on a plain
-- Postgres without the storage schema.
--   vendor-docs : selfies, masked Aadhaar, shop photos. Path = <vendor id>/<file>
--   pickup-photos: scale and scrap photos.      Path = <pickup id>/<file>
do $outer$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'storage schema not found, skipping buckets';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('vendor-docs',   'vendor-docs',   false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']),
    ('pickup-photos', 'pickup-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do nothing;

  execute $p$
    create policy "vendor docs: owner upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'vendor-docs' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
  execute $p$
    create policy "vendor docs: owner or admin read" on storage.objects for select to authenticated
      using (bucket_id = 'vendor-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  $p$;
  execute $p$
    create policy "vendor docs: owner delete" on storage.objects for delete to authenticated
      using (bucket_id = 'vendor-docs' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
  execute $p$
    create policy "pickup photos: assigned vendor upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'pickup-photos' and exists (
        select 1 from public.pickups p where p.id::text = (storage.foldername(name))[1] and p.vendor_id = auth.uid()))
  $p$;
  execute $p$
    create policy "pickup photos: parties read" on storage.objects for select to authenticated
      using (bucket_id = 'pickup-photos' and public.can_see_pickup(((storage.foldername(name))[1])::uuid))
  $p$;
end
$outer$;
