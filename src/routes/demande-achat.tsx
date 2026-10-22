import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/demande-achat")({
  component: () => <Navigate to="/achat" replace />,
});
