import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { formatUsaName, getUsaAddress } from "@/lib/usa-address";

export function UsaAddressCard({ fullName, code }: { fullName: string; code: string }) {
  const usa = getUsaAddress(useSettings());
  const rows: [string, string][] = [
    ["Nom Prénom", formatUsaName(usa.name_template, fullName, code)],
    ["Address Line 1", usa.line1],
    ["Address Line 2", usa.line2],
    ["City", usa.city],
    ["State", usa.state],
    ["ZIP", usa.zip],
    ["Country", usa.country],
    ["Phone", usa.phone],
  ].filter(([, v]) => v) as [string, string][];
  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success("Copié"));
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 min-w-0">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Votre adresse d'achat ({usa.country || "USA"}) — Box {code}</p>
      <div className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{k}</p>
              <p className="text-sm font-semibold break-words">{v}</p>
            </div>
            <button type="button" onClick={() => copy(v)} aria-label={`Copier ${k}`} className="shrink-0 p-2 rounded-md hover:bg-muted">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
