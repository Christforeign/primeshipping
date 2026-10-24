import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveExtraSettings } from "@/lib/admin-settings";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailTemplate } from "@/lib/email-templates";
import { sendClientEmail } from "@/lib/email.functions";

const SAMPLE = { nom: "Jean Exemple", code: "PS-0001", tracking: "1Z999AA10123456784", reference: "F-0042", montant: "45.00 USD", details: "Poids : 6 lbs" };

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
  const [kind, setKind] = useState<EmailKind>("colis_recu");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTpls(mergeTemplates(data["email_templates"]));
    setSender(String(data["email_sender"] || ""));
    setSenderName(String(data["email_sender_name"] || "Prime Express Shipping"));
  }, [data]);

  const t = tpls[kind];
  const upd = (p: Partial<EmailTemplate>) => setTpls({ ...tpls, [kind]: { ...t, ...p } });
  const preview = renderEmail(t, SAMPLE, senderName);

  async function save() {
    setBusy(true);
    try {
      await saveExtraSettings({ email_templates: tpls, email_sender: sender.trim(), email_sender_name: senderName.trim() });
      qc.invalidateQueries({ queryKey: ["email_settings"] });
      toast.success("Emails enregistrés");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function test() {
    if (!testTo) { toast.error("Saisis un email de test"); return; }
    setBusy(true);
    try {
      await saveExtraSettings({ email_templates: tpls, email_sender: sender.trim(), email_sender_name: senderName.trim() });
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
        <p className="text-xs text-muted-foreground">Variables : {"{{nom}} {{code}} {{tracking}} {{reference}} {{montant}} {{details}}"}</p>
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
    </div>
  );
}
