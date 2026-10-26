import { useState } from "react";
import { MessageCircle, ExternalLink, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import type { WhatsAppSupportContact } from "@/lib/types-store";
import { WhatsAppLogo } from "@/components/SocialIcon";
import { Button } from "@/components/ui/button";

export function cleanWhatsAppNumber(phone: string) {
  return (phone || "").replace(/[^0-9]/g, "");
}

export function whatsAppUrl(contact: { phone: string; prefilled_message?: string | undefined }) {
  const num = cleanWhatsAppNumber(contact.phone);
  const text =
    contact.prefilled_message ||
    "Bonjour Prime Express Shipping, je souhaite une assistance concernant mes services.";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function useWhatsAppContacts(): WhatsAppSupportContact[] {
  const s = useSettings() as { whatsapp_support_contacts?: WhatsAppSupportContact[] } | null;
  const list = Array.isArray(s?.whatsapp_support_contacts) ? s.whatsapp_support_contacts : [];
  return list.filter((c) => c.is_active !== false && cleanWhatsAppNumber(c.phone).length >= 8);
}

export function WhatsAppSupportButton() {
  const activeContacts = useWhatsAppContacts();
  const settings = useSettings();
  const defaultNumber = cleanWhatsAppNumber(settings?.whatsapp || "");
  const contacts = activeContacts.length ? activeContacts : defaultNumber.length >= 8 ? [{ id: "main", name: "Prime Shipping", phone: defaultNumber, is_active: true }] : [];
  const [isOpen, setIsOpen] = useState(false);

  // No number configured by admin: stay hidden, never invent a number.
  if (contacts.length === 0) return null;

  const handleButtonClick = () => {
    const primary = contacts[0];
    if (contacts.length === 1 && primary) {
      window.open(whatsAppUrl(primary), "_blank", "noopener,noreferrer");
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40 select-none">
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-1.5rem)] max-w-[340px] rounded-xl border border-border bg-card p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div>
              <h4 className="text-xs font-bold text-foreground">Support WhatsApp</h4>
              <p className="text-[11px] text-muted-foreground">Choisissez un service</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {contacts.map((c) => (
              <a
                key={c.id}
                href={whatsAppUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full p-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground block truncate">{c.name}</span>
                  {c.availability && (
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {c.availability}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-primary block">+{cleanWhatsAppNumber(c.phone)}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={handleButtonClick}
        variant="outline"
        className="h-14 w-14 rounded-full bg-card p-2 shadow-lg"
        title="Support WhatsApp"
        aria-label="Support WhatsApp"
      >
        <WhatsAppLogo className="h-10 w-10" />
      </Button>
    </div>
  );
}
