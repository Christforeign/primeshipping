import { useState, useEffect } from "react";
import { MessageCircle, Phone, ExternalLink, X, ChevronRight, Check } from "lucide-react";
import { clientStore, DEFAULT_WHATSAPP_CONTACTS } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import type { WhatsAppSupportContact } from "@/lib/types-store";

export function WhatsAppSupportButton() {
  const s = useSettings();
  const [contacts, setContacts] = useState<WhatsAppSupportContact[]>(DEFAULT_WHATSAPP_CONTACTS);
  const [isOpen, setIsOpen] = useState(false);

  const reloadContacts = () => {
    try {
      const list = clientStore.getWhatsAppContacts();
      if (Array.isArray(list) && list.length > 0) {
        setContacts(list);
      } else {
        setContacts(DEFAULT_WHATSAPP_CONTACTS);
      }
    } catch {
      setContacts(DEFAULT_WHATSAPP_CONTACTS);
    }
  };

  useEffect(() => {
    reloadContacts();
    const handleUpdate = () => reloadContacts();
    window.addEventListener("prime_whatsapp_contacts_changed", handleUpdate);
    window.addEventListener("prime_settings_changed", handleUpdate);
    return () => {
      window.removeEventListener("prime_whatsapp_contacts_changed", handleUpdate);
      window.removeEventListener("prime_settings_changed", handleUpdate);
    };
  }, []);

  const activeContacts = contacts.filter((c) => c.is_active !== false);

  const getCleanNumber = (phoneStr: string) => {
    return phoneStr.replace(/[^0-9]/g, "");
  };

  const getWhatsAppUrl = (contact: WhatsAppSupportContact) => {
    const rawNum = getCleanNumber(contact.phone || s?.whatsapp || s?.phone || "+50937000000");
    const prefilled =
      contact.prefilled_message ||
      `Bonjour Prime Express Shipping, je souhaite une assistance concernant mes services.`;
    return `https://wa.me/${encodeURIComponent(rawNum)}?text=${encodeURIComponent(prefilled)}`;
  };

  const handleButtonClick = () => {
    if (activeContacts.length === 1) {
      const url = getWhatsAppUrl(activeContacts[0]);
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleOpenContact = (c: WhatsAppSupportContact) => {
    const url = getWhatsAppUrl(c);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 left-3 lg:bottom-5 lg:left-5 z-40 select-none">
      {/* Popover Card for Multiple WhatsApp Contacts */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-1.5rem)] max-w-[340px] rounded-xl border border-border bg-card p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Support WhatsApp</h4>
                <p className="text-[11px] text-muted-foreground">
                  Choisissez un service disponible
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {activeContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleOpenContact(contact)}
                className="w-full text-left p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/50 hover:border-[#25D366]/50 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#25D366] inline-block animate-pulse" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {contact.name}
                    </span>
                  </div>
                  {contact.department && (
                    <span className="text-[10px] font-medium text-muted-foreground block truncate mt-0.5">
                      {contact.department}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-[#25D366] font-semibold block mt-0.5">
                    {contact.phone}
                  </span>
                </div>
                <div className="grid h-7 w-7 place-items-center rounded-md bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors ml-2 flex-shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Réponse rapide en direct</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <Check className="h-3 w-3" /> En ligne
            </span>
          </div>
        </div>
      )}

      {/* Main WhatsApp Support Trigger Button */}
      <button
        onClick={handleButtonClick}
        className="group flex items-center gap-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2.5 shadow-lg shadow-[#25D366]/25 transition-all hover:scale-105 active:scale-95 border border-[#1faa50]"
        title="Support WhatsApp"
      >
        <div className="relative">
          <MessageCircle className="h-5 w-5 fill-current" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-xs font-black tracking-tight block leading-tight">
            WhatsApp
          </span>
          <span className="text-[10px] font-medium opacity-90 block leading-tight">
            {activeContacts.length > 1
              ? `${activeContacts.length} services`
              : "Support direct"}
          </span>
        </div>
      </button>
    </div>
  );
}
