import { supabase } from "@/integrations/supabase/client";
import { clientStore } from "@/lib/store";

/** Merge keys into company_settings.extra (shared by every visitor). */
export async function saveExtraSettings(patch: Record<string, unknown>) {
  const { data: cur, error: readErr } = await supabase
    .from("company_settings")
    .select("extra")
    .eq("id", 1)
    .maybeSingle();
  if (readErr) throw readErr;
  const extra = { ...((cur?.extra as Record<string, unknown>) || {}), ...patch };
  const { error } = await supabase.from("company_settings").update({ extra: extra as never }).eq("id", 1);
  if (error) throw error;
  clientStore.saveSettings(patch as never);
}

export type ClientHit = { id: string; full_name: string; email: string | null; phone: string | null; client_code: string };

export async function searchClients(term: string): Promise<ClientHit[]> {
  const t = term.trim().replace(/[,%()]/g, "");
  if (t.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, client_code")
    .or(`full_name.ilike.%${t}%,email.ilike.%${t}%,client_code.ilike.%${t}%`)
    .limit(8);
  if (error) throw error;
  return (data || []) as ClientHit[];
}

export async function listClients(): Promise<ClientHit[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, client_code")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []) as ClientHit[];
}
