import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/assister-achat")({
  component: () => <Navigate to="/achat" replace />,
});
