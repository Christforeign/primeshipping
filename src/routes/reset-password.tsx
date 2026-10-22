// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Prime Entreprise" },
      { name: "description", content: "Choisissez un nouveau mot de passe." },
      { property: "og:title", content: "Nouveau mot de passe — Prime Entreprise" },
      { property: "og:description", content: "Réinitialisation du mot de passe." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("8 caractères minimum");
    if (pw !== pw2) return toast.error("Les mots de passe ne correspondent pas");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error("Lien expiré ou invalide. Recommencez la procédure.");
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/compte" });
  };
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-8">
        <h1 className="text-2xl font-bold text-forest">Nouveau mot de passe</h1>
        <div className="space-y-1.5">
          <Label>Mot de passe</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Confirmer</Label>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
