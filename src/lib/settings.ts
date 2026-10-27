import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { EnrichedCompanySettings } from "./types-store";
import { DEFAULT_SETTINGS } from "./store";

export type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"] &
  EnrichedCompanySettings;

export const settingsQuery = queryOptions({
  queryKey: ["company_settings"],
  queryFn: async () => {
    const storeSettings = DEFAULT_SETTINGS;
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (!error && data) {
        const extra = { ...((data as { extra?: Record<string, unknown> }).extra ?? {}) };
        // Never show leftover demo values
        const FAKE = /120-1029|240-5819|3700-|Prime Express Shipping S\.A|555-0199/i;
        for (const k of Object.keys(extra)) {
          if (typeof extra[k] === "string" && FAKE.test(extra[k] as string)) extra[k] = "";
        }
        return { ...storeSettings, ...data, ...extra } as unknown as CompanySettings;
      }
    } catch {
      // safe fallback
    }
    return storeSettings as unknown as CompanySettings;
  },
  staleTime: 10_000,
});

export function useSettings() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const query = useQuery(settingsQuery);
  // A client cache may already contain settings when SSR used defaults.
  // Match the first browser render to SSR before exposing cached values.
  return hydrated ? query.data ?? null : null;
}
