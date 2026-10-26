CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  return new;
end $function$;