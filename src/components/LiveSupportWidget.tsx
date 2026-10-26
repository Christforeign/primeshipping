import { sendClientEmail } from "@/lib/email.functions";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Headset, X, MessageCircle, Mail, Send, HelpCircle, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppContacts, whatsAppUrl } from "@/components/WhatsAppSupportButton";

type Faq = { q: string; a: string };
type Tab = "chat" | "contact" | "faq";

function LiveChat({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const q = useQuery({
    queryKey: ["support-mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_messages").select("*").eq("user_id", userId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel(`support-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${userId}` }, () =>
        qc.invalidateQueries({ queryKey: ["support-mine", userId] }),
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [userId, qc]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [q.data]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const { data: saved, error } = await supabase.from("support_messages").insert({ user_id: userId, sender: "client", body }).select("id").single();
    if (error) return void toast.error(error.message);
    if (saved) { try { await sendClientEmail({ data: { kind: "support", supportMessageId: saved.id } }); } catch { /* journalisé côté serveur */ } }
    qc.invalidateQueries({ queryKey: ["support-mine", userId] });
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(q.data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Écrivez votre message, un agent vous répond ici en direct.</p>
        )}
        {(q.data ?? []).map((m) => (
          <div key={m.id} className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap break-words ${m.sender === "client" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.body}
            </p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-border">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Votre message…" className="flex-1 min-w-0 h-10 rounded-lg border bg-background px-3 text-sm" />
        <button type="submit" aria-label="Envoyer" className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-primary text-primary-foreground">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function LiveSupportWidget() {
  const s = useSettings() as any;
  const { user } = useUser();
  const contacts = useWhatsAppContacts();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const faq: Faq[] = Array.isArray(s?.support_faq) ? s.support_faq.filter((f: Faq) => f?.q && f?.a) : [];
  const email: string | undefined = s?.email || undefined;

  const tabs: { k: Tab; label: string; icon: typeof Mail }[] = [
    { k: "chat", label: "Chat", icon: MessagesSquare },
    { k: "contact", label: "WhatsApp / E-mail", icon: Mail },
    ...(faq.length ? [{ k: "faq" as Tab, label: "FAQ", icon: HelpCircle }] : []),
  ];

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40">
      {open ? (
        <div className="w-[calc(100vw-1.5rem)] max-w-[380px] h-[min(70vh,520px)] rounded-xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-forest text-forest-foreground p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Headset className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-sm truncate">Support en direct</h3>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="p-1.5 rounded-md hover:bg-background/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex border-b border-border">
            {tabs.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className={`flex-1 text-[11px] font-bold py-2 inline-flex items-center justify-center gap-1 ${tab === t.k ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {tab === "chat" &&
              (user ? (
                <LiveChat userId={user.id} />
              ) : (
                <div className="p-5 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Connectez-vous pour discuter en direct avec un agent.</p>
                  <Link to="/auth" onClick={() => setOpen(false)} className="inline-block rounded-lg bg-primary text-primary-foreground text-xs font-bold px-4 py-2">Se connecter</Link>
                </div>
              ))}
            {tab === "contact" && (
              <div className="p-3 space-y-2">
                {contacts.map((c, i) => (
                  <a key={i} href={whatsAppUrl({ phone: c.phone, prefilled_message: c.prefilled_message })} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-lg bg-[#25D366] text-white text-xs font-bold p-3">
                    <MessageCircle className="h-4 w-4 shrink-0" /> <span className="truncate">WhatsApp {(c as any).label || c.phone}</span>
                  </a>
                ))}
                {email ? (
                  <a href={`mailto:${email}?subject=${encodeURIComponent("Demande de support")}`} className="w-full flex items-center gap-2 rounded-lg border border-border bg-background text-xs font-bold p-3 hover:bg-muted">
                    <Mail className="h-4 w-4 text-primary shrink-0" /> <span className="truncate">{email}</span>
                  </a>
                ) : null}
                {!contacts.length && !email && (
                  <p className="text-xs text-muted-foreground text-center py-4">Les contacts seront affichés dès leur configuration dans l'administration.</p>
                )}
              </div>
            )}
            {tab === "faq" && (
              <div className="p-3 space-y-2">
                {faq.map((f) => (
                  <details key={f.q} className="rounded-lg border border-border bg-background p-3 text-xs">
                    <summary className="font-semibold cursor-pointer">{f.q}</summary>
                    <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{f.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2.5 shadow-lg" aria-label="Support en direct">
          <Headset className="h-5 w-5" />
          <span className="text-xs font-bold hidden sm:block">Aide</span>
        </button>
      )}
    </div>
  );
}
