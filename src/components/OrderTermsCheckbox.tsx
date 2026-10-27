import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Case à cocher obligatoire avant toute commande : le client accepte les
 * conditions d'utilisation (lien cliquable vers la page complète).
 */
export function OrderTermsCheckbox({ checked, onCheckedChange, id = "accept-order-terms" }: { checked: boolean; onCheckedChange: (value: boolean) => void; id?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-secondary/40 p-3.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} className="mt-0.5" aria-label="Accepter les conditions d'utilisation" />
      <label htmlFor={id} className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
        En continuant, vous acceptez nos{" "}
        <Link to="/conditions" target="_blank" className="font-bold text-amber-600 underline underline-offset-2 hover:text-amber-500" onClick={(e) => e.stopPropagation()}>
          conditions d'utilisation
        </Link>
        .
      </label>
    </div>
  );
}
