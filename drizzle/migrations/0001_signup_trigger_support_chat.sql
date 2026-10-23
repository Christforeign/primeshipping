CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.profiles (id, email, full_name, phone, country, region, city, address_line, address_line2)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'address_line',
    new.raw_user_meta_data->>'address_line2')
  on conflict (id) do nothing;
  insert into public.wallets (user_id) select new.id where not exists (select 1 from public.wallets where user_id = new.id);
  if lower(new.email) = 'blaisechristeveste@gmail.com' then
    insert into public.user_roles (user_id, role) select new.id, 'super_admin'
    where not exists (select 1 from public.user_roles where user_id = new.id and role = 'super_admin');
  end if;
  return new;
end $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name','') FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender text NOT NULL DEFAULT 'client' CHECK (sender IN ('client','staff')),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support read own or staff" ON public.support_messages FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "support client insert" ON public.support_messages FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid() AND sender = 'client') OR (public.is_staff(auth.uid()) AND sender = 'staff'));
CREATE INDEX support_messages_user_idx ON public.support_messages(user_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;