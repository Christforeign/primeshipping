DROP POLICY IF EXISTS "media read authenticated" ON storage.objects;
CREATE POLICY "media read own or staff" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND (((storage.foldername(name))[2] = (auth.uid())::text) OR public.is_staff(auth.uid())));