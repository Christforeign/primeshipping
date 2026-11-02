import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendManualBrevo } from "./manual-brevo.server";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("broadcast recipients", () => {
  it("sends the photo privately to every saved account, including the administrator", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const profiles = [
      { id: "client", email: "client@example.test", full_name: "Client", client_code: "PS1" },
      { id: "admin", email: "admin@example.test", full_name: "Admin", client_code: "PS2" },
    ];
    const query = { order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: profiles, error: null }) };
    const from = vi.fn((table: string) => {
      if (table === "company_settings") return { select: () => ({ eq: () => ({ single: async () => ({ data: { extra: {} }, error: null }) }) }) };
      if (table === "profiles") return { select: () => query };
      throw new Error(`Unexpected table ${table}`);
    });
    const result = await sendManualBrevo({ from } as unknown as SupabaseClient<Database>, "admin", {
      audience: "all", subject: "Frais de port", message: "Taxe générale : 1.75 $ par facture", imageUrl: "https://primeshipping.net/photo.jpeg", confirmed: true, eventId: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.sent).toBe(2);
    const requests = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));
    expect(requests.map((body) => body.to)).toEqual([[{ email: "client@example.test" }], [{ email: "admin@example.test" }]]);
    expect(requests.every((body) => body.htmlContent.includes('src="https://primeshipping.net/photo.jpeg"'))).toBe(true);
  });
});