import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/achat-assiste")({
  component: () => <Navigate to="/achat" replace />,
});
