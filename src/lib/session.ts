import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./labels";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export const rolesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

export function useRoles(userId: string | undefined) {
  const { user } = useUser();
  const q = useQuery(rolesQuery(userId));
  const roles = q.data ?? [];
  const isSuperEmail = user?.email?.toLowerCase() === "blaisechristeveste@gmail.com";
  return {
    roles,
    loading: q.isLoading,
    isStaff: isSuperEmail || roles.length > 0,
    isAdmin: isSuperEmail || roles.includes("super_admin") || roles.includes("admin"),
    isSuper: isSuperEmail || roles.includes("super_admin"),
    canPackages:
      isSuperEmail || roles.some((r) => ["super_admin", "admin", "agent_colis"].includes(r)),
  };
}

export const profileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export async function signOut(clear: () => void) {
  clear();
  await supabase.auth.signOut();
}
