import { formatDate, statusLabel, type PackageStatus } from "@/lib/labels";

export function PackageTimeline({
  events,
}: {
  events: {
    id: string;
    status: PackageStatus;
    note: string | null;
    created_at: string;
    is_internal?: boolean;
  }[];
}) {
  if (events.length === 0)
    return <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>;
  return (
    <ol className="space-y-4 border-l-2 border-primary/30 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
          <p className="font-semibold">
            {statusLabel(e.status)}{" "}
            {e.is_internal && (
              <span className="ml-2 rounded bg-muted px-1.5 text-xs text-muted-foreground">
                interne
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(e.created_at)}</p>
          {e.note && <p className="mt-1 text-sm">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
