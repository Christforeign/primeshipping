// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Search, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { HAITI_CITIES } from "@/lib/cities-haiti";
import { clientStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Inscription & Connexion — Prime Shipping" },
      {
        name: "description",
        content:
          "Créez votre compte, choisissez votre ville en Haïti et votre adresse de livraison.",
      },
      { property: "og:title", content: "Inscription & Connexion — Prime Shipping" },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, "Nom requis").max(100),
    email: z.string().trim().email("E-mail invalide").max(255),
    phone: z.string().trim().min(6, "Téléphone requis").max(30),
    city: z.string().trim().min(2, "Ville requise en Haïti").max(60),
    department: z.string().trim().max(60).optional(),
    delivery_address: z.string().trim().min(3, "Adresse requise").max(200),
    password: z.string().min(8, "8 caractères minimum").max(72),
    confirm: z.string(),
    accept: z.literal(true, {
      errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation" }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Form Fields
  const [f, setF] = useState<Record<string, string>>({ city: "", department: "" });
  const [accept, setAccept] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/compte" });
    });
  }, [navigate]);

  const filteredCities = HAITI_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.department.toLowerCase().includes(citySearch.toLowerCase()),
  );

  const handleSelectCity = (cityName: string, dept: string) => {
    setF({ ...f, city: cityName, department: dept });
    setCitySearch(cityName);
    setShowCityDropdown(false);
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: f["email"]?.trim() ?? "",
          password: f["password"] ?? "",
        });
        if (error)
          throw new Error(
            error.message.includes("confirm")
              ? "Confirmez d'abord votre e-mail."
              : "E-mail ou mot de passe incorrect.",
          );
        navigate({ to: "/compte" });
      } else if (mode === "forgot") {
        const email = z.string().email().safeParse(f["email"]?.trim());
        if (!email.success) throw new Error("E-mail invalide");
        await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setSent(true);
      } else {
        const p = signupSchema.safeParse({ ...f, accept });
        if (!p.success) throw new Error(p.error.issues[0]?.message ?? "Champs invalides");
        const { confirm: _c, accept: _a, password, email, ...meta } = p.data;

        // Save local Haitian profile
        clientStore.saveHaitiProfile({
          id: email,
          full_name: meta.full_name,
          email,
          phone: meta.phone,
          city: meta.city,
          department: meta.department,
          delivery_address: meta.delivery_address,
          delivery_preference: meta.delivery_preference,
          preferred_agency: meta.preferred_agency,
          updated_at: new Date().toISOString(),
        });

        const { data: su, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: meta.full_name,
              phone: meta.phone,
              country: "Haïti",
              city: meta.city,
              region: meta.department,
              address_line: meta.delivery_address,
            },
          },
        });

        if (error) {
          throw new Error(
            error.message.toLowerCase().includes("registered")
              ? "Cet e-mail a déjà un compte. Connectez-vous."
              : "Inscription impossible : " + error.message,
          );
        }

        if (!su.session) {
          const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
          if (e2) throw new Error("Compte créé. Connectez-vous avec votre e-mail.");
        }
        toast.success("Bienvenue chez Prime Shipping !");
        navigate({ to: "/compte" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-forest">Compte enregistré !</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          {mode === "forgot"
            ? "Si un compte existe, un lien de réinitialisation vient d'être envoyé."
            : "Votre compte a été initialisé. Vous pouvez désormais vous connecter ou accéder directement à vos commandes et adresses d'expédition."}
        </p>
        <div className="mt-6">
          <Button
            variant="sun"
            className="rounded-xl px-6 font-bold"
            onClick={() => {
              setSent(false);
              navigate({ to: "/auth", search: { mode: "login" } });
            }}
          >
            Se connecter maintenant
          </Button>
        </div>
      </div>
    );
  }

  const field = (
    k: string,
    label: string,
    type = "text",
    placeholder = "",
    icon?: React.ReactNode,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={k} className="text-xs font-bold text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={k}
          type={type}
          placeholder={placeholder}
          value={f[k] ?? ""}
          onChange={set(k)}
          required
          className="rounded-xl text-sm"
        />
        {icon && (
          <div className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-3xl border bg-card p-6 shadow-xl md:p-10">
        <div className="mb-6">
          <span className="text-xs font-extrabold uppercase tracking-wider text-accent bg-forest px-3 py-1 rounded-full">
            Prime Shipping
          </span>
          <h1 className="text-3xl font-black text-forest mt-3">
            {mode === "signup"
              ? "Créer mon compte client"
              : mode === "forgot"
                ? "Mot de passe oublié"
                : "Connexion à mon espace"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "signup"
              ? "Renseignez votre ville actuelle en Haïti et votre adresse pour recevoir vos colis."
              : "Accédez au suivi de vos colis, vos achats et votre portefeuille."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" &&
            field(
              "full_name",
              "Nom complet",
              "text",
              "Ex: Jean-Baptiste Pierre",
              <User className="h-4 w-4" />,
            )}

          {field(
            "email",
            "Adresse e-mail",
            "email",
            "nom@exemple.com",
            <Mail className="h-4 w-4" />,
          )}

          {mode === "signup" && (
            <>
              {field(
                "phone",
                "Numéro de téléphone (Haïti ou WhatsApp)",
                "tel",
                "+509 3700 0000",
                <Phone className="h-4 w-4" />,
              )}

              {/* SECTEUR VILLE ACTUELLE EN HAÏTI (Recherche intuitive) */}
              <div className="space-y-1.5 relative">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Ville actuelle en Haïti *</span>
                  <span className="text-[11px] text-muted-foreground">
                    Département : <strong className="text-forest">{f["department"] || "—"}</strong>
                  </span>
                </Label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Tapez votre ville..."
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setF((prev) => ({ ...prev, city: e.target.value }));
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                      className="rounded-xl text-sm"
                    />
                    <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-forest" />
                  </div>
                </div>

                {/* Dropdown list of cities */}
                {showCityDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-2xl border bg-card p-1 shadow-2xl">
                    <div className="text-[10px] font-bold text-muted-foreground px-3 py-1 uppercase">
                      Villes & Communes d'Haïti
                    </div>
                    {filteredCities.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSelectCity(c.name, c.department)}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                          f["city"] === c.name
                            ? "bg-accent text-accent-foreground font-bold"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          {c.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{c.department}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ADRESSE COMPLETE DE LIVRAISON */}
              <div className="space-y-1.5">
                <Label htmlFor="delivery_address" className="text-xs font-bold">
                  Votre adresse en Haïti *
                </Label>
                <Input
                  id="delivery_address"
                  placeholder="Quartier, Rue, Numéro, Repère (Ex: Delmas 33, Rue Charlemagne, près de l'école)"
                  value={f["delivery_address"] ?? ""}
                  onChange={(e) => setF({ ...f, delivery_address: e.target.value })}
                  required
                  className="rounded-xl text-sm"
                />
              </div>
            </>
          )}

          {mode !== "forgot" &&
            field("password", "Mot de passe", "password", "••••••••", <Lock className="h-4 w-4" />)}
          {mode === "signup" &&
            field(
              "confirm",
              "Confirmer le mot de passe",
              "password",
              "••••••••",
              <Lock className="h-4 w-4" />,
            )}

          {mode === "signup" && (
            <label className="flex items-start gap-2.5 text-xs pt-1">
              <Checkbox
                checked={accept}
                onCheckedChange={(v) => setAccept(v === true)}
                className="mt-0.5"
              />
              <span className="leading-tight text-muted-foreground">
                J'accepte les{" "}
                <Link to="/conditions" className="text-primary font-bold underline">
                  conditions générales d'utilisation & la politique de confidentialité
                </Link>{" "}
                de Prime Shipping.
              </span>
            </label>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl py-6 font-bold text-sm"
            variant="sun"
            disabled={busy}
          >
            {busy
              ? "Traitement en cours…"
              : mode === "signup"
                ? "Créer mon compte client"
                : mode === "forgot"
                  ? "Envoyer le lien de réinitialisation"
                  : "Se connecter à mon espace"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs">
          {mode === "login" ? (
            <>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="text-primary font-bold hover:underline"
              >
                Pas encore de compte ? S'inscrire
              </Link>
              <Link
                to="/auth"
                search={{ mode: "forgot" }}
                className="text-muted-foreground hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="text-primary font-bold hover:underline"
            >
              J'ai déjà un compte : Me connecter
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
