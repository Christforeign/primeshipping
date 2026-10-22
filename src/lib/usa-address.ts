// Purchase (USA) address shown to clients and pickup branches — all editable in admin settings.
export type UsaAddress = {
  name_template: string; // {nom} = client name, {code} = client box code (e.g. PS 0001)
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export const DEFAULT_USA_ADDRESS: UsaAddress = {
  name_template: "{nom} Prime Shipping {code}",
  line1: "10049 NW 89TH AVE",
  line2: "UNIT 2PC-046344",
  city: "Medley",
  state: "Florida",
  zip: "",
  country: "USA",
  phone: "",
};

export function getUsaAddress(s: unknown): UsaAddress {
  const saved = ((s as { usa_address?: Partial<UsaAddress> } | null)?.usa_address ??
    {}) as Partial<UsaAddress>;
  return { ...DEFAULT_USA_ADDRESS, ...saved };
}

export function formatUsaName(tpl: string, fullName: string, clientCode: string): string {
  return tpl
    .replace(/\{nom\}/g, fullName || "")
    .replace(/\{code\}/g, (clientCode || "").replace("-", " "))
    .replace(/\s+/g, " ")
    .trim();
}

export type PickupBranch = { id: string; name: string; address: string; phone: string };

/** One branch per line: "Nom | Adresse | Téléphone" */
export function parseBranches(text: string | null | undefined): PickupBranch[] {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const [name = "", address = "", phone = ""] = l.split("|").map((x) => x.trim());
      return { id: `b${i}`, name, address, phone };
    })
    .filter((b) => b.name);
}
