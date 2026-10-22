import { cva } from "class-variance-authority";
import { statusLabel, statusTone, type PackageStatus } from "@/lib/labels";

const badge = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        muted: "bg-muted text-muted-foreground",
        progress: "bg-secondary text-secondary-foreground",
        ready: "bg-accent text-accent-foreground",
        done: "bg-primary text-primary-foreground",
        alert: "bg-destructive text-destructive-foreground",
      },
    },
  },
);

export function StatusBadge({ status }: { status: PackageStatus }) {
  return <span className={badge({ tone: statusTone(status) })}>{statusLabel(status)}</span>;
}
