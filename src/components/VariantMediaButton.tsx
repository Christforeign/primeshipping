import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage, uploadVideo } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";

/** Pick a photo or video from the gallery for one product variant. */
export function VariantMediaButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true);
        try {
          const folder = "products/variants";
          const url = file.type.startsWith("video/") ? await uploadVideo(folder, file) : await uploadImage(folder, file);
          onUploaded(url);
          toast.success("Média de la variante ajouté.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Envoi impossible.");
        } finally { setBusy(false); }
      }} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()} className="rounded-xl text-[10px] h-7">
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />} Choisir
      </Button>
    </>
  );
}
