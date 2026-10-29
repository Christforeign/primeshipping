import { renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useUser } from "./session";

const unsubscribe = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: {
    getSession: () => Promise.reject(new DOMException("Denied", "SecurityError")),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe } } }),
  } },
}));

it("finishes session loading safely when browser session access fails", async () => {
  const { result, unmount } = renderHook(() => useUser());
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(result.current.user).toBeNull();
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});