CREATE OR REPLACE FUNCTION public.public_received_parcels(p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 WITH received AS (
  SELECT i.tracking, i.created_at AS received_at
  FROM public.priority_imports i LEFT JOIN public.packages p ON p.id=i.package_id
  WHERE i.package_id IS NULL OR (p.id IS NOT NULL AND p.status NOT IN ('livre','retourne'))
  UNION ALL
  SELECT coalesce(nullif(trim(p.carrier_tracking),''),p.tracking_number),p.received_at
  FROM public.packages p WHERE p.received_at IS NOT NULL AND p.status NOT IN ('livre','retourne')
  AND NOT EXISTS (SELECT 1 FROM public.priority_imports i WHERE i.package_id=p.id OR lower(regexp_replace(i.tracking,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(coalesce(nullif(trim(p.carrier_tracking),''),p.tracking_number),'[^a-zA-Z0-9]','','g')))
 ), unique_received AS (
  SELECT DISTINCT ON (upper(regexp_replace(tracking,'[^a-zA-Z0-9]','','g'))) upper(regexp_replace(tracking,'[^a-zA-Z0-9]','','g')) AS tracking,received_at FROM received
  WHERE length(regexp_replace(tracking,'[^a-zA-Z0-9]','','g'))>=5
  ORDER BY upper(regexp_replace(tracking,'[^a-zA-Z0-9]','','g')), received_at DESC
 ), page AS (
  SELECT right(tracking,5) AS suffix,
   CASE WHEN tracking LIKE 'GFUS%' THEN 'GOFO'
    WHEN tracking ~ '^(9[2345][0-9]{18,24}|[0-9]{30})$' THEN 'USPS'
    WHEN tracking ~ '^1Z[A-Z0-9]{16}$' THEN 'UPS'
    WHEN tracking LIKE 'TBA%' THEN 'Amazon Logistics'
    ELSE 'Transporteur non identifié' END AS carrier,received_at
  FROM unique_received ORDER BY received_at DESC NULLS LAST,tracking
  LIMIT 50 OFFSET greatest(0,least(coalesce(p_offset,0),1000000))
 ) SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(jsonb_build_object('suffix',suffix,'carrier',carrier,'received_at',received_at)) FROM page),'[]'::jsonb),'total',(SELECT count(*) FROM unique_received));
$$;
REVOKE ALL ON FUNCTION public.public_received_parcels(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_received_parcels(integer) TO anon,authenticated,service_role;