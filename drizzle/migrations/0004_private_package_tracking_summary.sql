CREATE OR REPLACE FUNCTION public.track_package(_tracking text)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT (jsonb_build_object(
  'tracking_number', p.tracking_number, 'status', p.status, 'updated_at', p.updated_at, 'received_at', p.received_at,
  'next_step', CASE p.status::text
    WHEN 'declare' THEN 'Réception du colis'
    WHEN 'attente_reception' THEN 'Réception du colis'
    WHEN 'recu_entrepot' THEN 'Départ en transit'
    WHEN 'preparation' THEN 'Départ en transit'
    WHEN 'expedie' THEN 'Acheminement vers la succursale'
    WHEN 'en_transit' THEN 'Acheminement vers la succursale'
    WHEN 'livraison_locale' THEN 'Entrée en stock à la succursale'
    WHEN 'arrive_haiti' THEN 'Mise à disposition'
    WHEN 'douane' THEN 'Mise à disposition'
    WHEN 'disponible_retrait' THEN 'Retrait ou livraison au destinataire'
    WHEN 'livre' THEN 'Acheminement terminé'
    ELSE 'Contactez notre équipe pour la suite'
  END,
  'is_owner', coalesce(p.user_id = auth.uid(), false)
 ) || CASE WHEN p.user_id = auth.uid() THEN jsonb_build_object(
  'description', p.description,
  'weight_lbs', coalesce(p.actual_weight_lb, p.estimated_weight_lb),
  'events', coalesce((SELECT json_agg(json_build_object('status', e.status, 'note', e.note, 'created_at', e.created_at) ORDER BY e.created_at DESC)
   FROM public.package_events e WHERE e.package_id = p.id AND NOT e.is_internal), '[]'::json)
 ) ELSE '{}'::jsonb END)::json
 FROM public.packages p WHERE upper(p.tracking_number) = upper(trim(_tracking)) LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.track_package(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_package(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.track_package(text) IS 'Public tracking exposes only status, timestamps and next step. Private fields and event notes are returned exclusively to the owner.';