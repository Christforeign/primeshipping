import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveExtraSettings } from "@/lib/admin-settings";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailTemplate } from "@/lib/email-templates";
import { sendClientEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { ClientPicker } from "@/components/ClientPicker";
import type { ClientHit } from "@/lib/admin-settings";

const SAMPLE = { nom: "Jean Exemple", code: "PS-0001", tracking: "1Z999AA10123456784", reference: "F-0042", montant: "45.00 USD", details: "Poids : 6 lbs", statut: "Reçu", prochaine_etape: "En transit", date: "26 octobre 2026 à 12:43" };

function ManualSend() {
  const send = useServerFn(sendClientEmail);
  const [client, setClient] = useState<ClientHit | null>(null);
  const [kind, setKind] = useState<EmailKind>("support");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!client) { toast.error("Choisis un client"); return; }
    if (!details.trim()) { toast.error("Écris un message"); return; }
    setBusy(true);
    try {
      const r = await send({ data: { kind, userId: client.id, vars: { details: details.trim() }, test: true } });
      if (r.sent) { toast.success(`E-mail envoyé à ${client.full_name || client.email}`); setDetails(""); }
      else toast.error(r.reason || "Non envoyé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally { setBusy(false); }
  };
  const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="font-bold">Envoyer un e-mail à un client</h3>
      {client ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{client.full_name} — {client.client_code} — {client.email}</span>
          <button onClick={() => setClient(null)} className="text-xs text-primary">Changer</button>
        </div>
      ) : (
        <ClientPicker onPick={setClient} />
      )}
      <select className={inp} value={kind} onChange={(e) => setKind(e.target.value as EmailKind)}>
        {EMAIL_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
      </select>
      <textarea className={inp} rows={4} placeholder="Message (remplace {{details}} dans le modèle)" value={details} onChange={(e) => setDetails(e.target.value)} />
      <button disabled={busy} onClick={go} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{busy ? "Envoi..." : "Envoyer"}</button>
    </div>
  );
}

export function AdminEmailTemplates() {
  const qc = useQueryClient();
  const send = useServerFn(sendClientEmail);
  const { data } = useQuery({
    queryKey: ["email_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("company_settings").select("extra").eq("id", 1).maybeSingle();
      return ((data?.extra as Record<string, unknown>) || {}) as Record<string, unknown>;
    },
  });
  const [tpls, setTpls] = useState<Record<EmailKind, EmailTemplate>>(mergeTemplates({}));
  const [sender, setSender] = useState("");
  const [senderName, setSenderName] = useState("Prime Express Shipping");
  const [logoUrl, setLogoUrl] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [adminRecipients, setAdminRecipients] = useState("");
  const [adminEnabled, setAdminEnabled] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [kind, setKind] = useState<EmailKind>("colis_recu");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTpls(mergeTemplates(data["email_templates"]));
    setSender(String(data["email_sender"] || ""));
    setSenderName(String(data["email_sender_name"] || "Prime Express Shipping"));
    setLogoUrl(String(data["email_logo_url"] || ""));
    setStoreLogoUrl(String(data["email_store_logo_url"] || ""));
    setAdminRecipients(String(data["email_admin_recipients"] || ""));
    setAdminEnabled(data["email_admin_alerts_enabled"] === true);
  }, [data]);

  const t = tpls[kind];
  const upd = (p: Partial<EmailTemplate>) => setTpls({ ...tpls, [kind]: { ...t, ...p } });
  const isOrder = kind.startsWith("commande");
  const preview = renderEmail(t, isOrder ? { ...SAMPLE, brand: "store", produit: "Article commandé", quantite: "1", paiement: "Portefeuille Prime", statut: "Commande en traitement", tracking: "" } : SAMPLE, senderName, (isOrder ? storeLogoUrl : logoUrl) || undefined);

  async function resendPackage() {
    setBusy(true);
    try { const r = await send({ data: { kind: "colis_recu", packageId: packageId.trim() } }); r.sent ? toast.success("Brevo a accepté l’e-mail du colis") : toast.error(r.reason); } catch (e) { toast.error(e instanceof Error ? e.message : "Envoi impossible"); } finally { setBusy(false); }
  }

  async function save() {
    if (adminEnabled && adminRecipients.split(/[\s,;]+/).filter(Boolean).some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return toast.error("Une adresse administrateur est invalide.");
    setBusy(true);
    try {
      await saveExtraSettings({ email_templates: tpls, email_sender: sender.trim(), email_sender_name: senderName.trim(), email_logo_url: logoUrl.trim(), email_store_logo_url: storeLogoUrl.trim(), email_admin_recipients: adminRecipients.trim(), email_admin_alerts_enabled: adminEnabled });
      qc.invalidateQueries({ queryKey: ["email_settings"] });
      toast.success("Emails enregistrés");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function test() {
    if (!testTo) { toast.error("Saisis un email de test"); return; }
    setBusy(true);
    try {
      await saveExtraSettings({ email_templates: tpls, email_sender: sender.trim(), email_sender_name: senderName.trim(), email_logo_url: logoUrl.trim(), email_store_logo_url: storeLogoUrl.trim(), email_admin_recipients: adminRecipients.trim(), email_admin_alerts_enabled: adminEnabled });
      const r = await send({ data: { kind, toEmail: testTo.trim(), vars: SAMPLE, test: true } });
      r.sent ? toast.success("Email de test envoyé") : toast.error(r.reason);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  return (
    <div className="space-y-5 min-w-0">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Expéditeur (Brevo)</h3>
        <p className="text-xs text-muted-foreground">Utilise l'adresse vérifiée dans Brevo (Expéditeurs & domaines).</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inp} placeholder="Nom affiché" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          <input className={inp} type="email" placeholder="ton-email@exemple.com" value={sender} onChange={(e) => setSender(e.target.value)} />
        </div>
        <input className={inp} type="url" placeholder="Logo des e-mails — adresse https (facultatif)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Alertes administrateurs</h3>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adminEnabled} onChange={(e) => setAdminEnabled(e.target.checked)} /> Recevoir les alertes d’activité</label>
        <textarea className={inp} rows={3} aria-label="E-mails administrateurs" placeholder="Adresses e-mail séparées par une virgule ou une ligne" value={adminRecipients} onChange={(e) => setAdminRecipients(e.target.value)} />
        <input className={inp} type="url" placeholder="Logo Prime Store des e-mails (facultatif)" value={storeLogoUrl} onChange={(e) => setStoreLogoUrl(e.target.value)} />
        <Button disabled={busy} onClick={save}>Enregistrer</Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Renvoyer l’e-mail d’un colis</h3>
        <input className={inp} aria-label="Identifiant du colis" placeholder="Identifiant du colis (dans son adresse de page)" value={packageId} onChange={(e) => setPackageId(e.target.value)} />
        <Button disabled={busy || !packageId.trim()} onClick={resendPackage}>Renvoyer le statut actuel</Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {EMAIL_KINDS.map((k) => (
            <button key={k.kind} onClick={() => setKind(k.kind)} className={`rounded-full px-3 py-1 text-xs border ${kind === k.kind ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{k.label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={t.enabled} onChange={(e) => upd({ enabled: e.target.checked })} /> Envoi automatique activé</label>
        <input className={inp} value={t.subject} onChange={(e) => upd({ subject: e.target.value })} placeholder="Sujet" />
        <textarea className={inp} rows={6} value={t.body} onChange={(e) => upd({ body: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">Couleur <input type="color" value={t.color} onChange={(e) => upd({ color: e.target.value })} /></label>
        <p className="text-xs text-muted-foreground">Variables : {"{{nom}} {{code}} {{tracking}} {{reference}} {{montant}} {{details}} {{statut}} {{prochaine_etape}} {{date}}"}</p>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="text-xs px-3 py-2 bg-muted">Aperçu — {preview.subject}</div>
          <div className="max-w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: preview.html }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Enregistrer</button>
          <input className={`${inp} max-w-xs`} type="email" placeholder="Email de test" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <button disabled={busy} onClick={test} className="rounded-md border border-border px-4 py-2 text-sm">Envoyer un test</button>
        </div>
      </div>
      <ManualSend />
    </div>
  );
}
