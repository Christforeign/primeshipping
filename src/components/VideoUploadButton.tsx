import { useRef, useState } from "react";
import { toast } from "sonner";
import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadVideo } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";

export function VideoUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const { data } = await supabase.auth.getUser();
            const url = await uploadVideo(data.user?.id ?? "public", file);
            onUploaded(url);
            toast.success("Vidéo ajoutée.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Envoi impossible.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()} className="rounded-xl text-xs">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
        {busy ? "Envoi…" : "Choisir une vidéo depuis la galerie"}
      </Button>
    </>
  );
}
