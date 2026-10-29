import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/juladmin")({
  head: () => ({
    meta: [
      { title: "Accès Privé — Administration Prime" },
      { name: "description", content: "Accès direct administration." },
      { property: "og:title", content: "Accès Privé — Administration Prime" },
      { property: "og:description", content: "Accès direct administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: JulAdmin,
});

function JulAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      toast.error("Identifiants invalides.");
      return;
    }
    await supabase.rpc("claim_first_admin");
    const { data: u } = await supabase.auth.getUser();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user?.id ?? "");
    setBusy(false);
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      toast.error("Identifiants invalides.");
      return;
    }
    navigate({ to: "/compte/admin", replace: true });
    } catch {
      toast.error("Connexion interrompue. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-sm"
      >
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <Lock className="h-5 w-5" /> Connexion
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e">E-mail</Label>
          <Input
            id="e"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p">Mot de passe</Label>
          <Input
            id="p"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "…" : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
