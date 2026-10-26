import { describe, expect, it } from "vitest";

// Opt-in live authorization regression tests. No existing accounts are deleted.
const enabled = process.env['RUN_ADMIN_DELETION_TESTS'] === "1";
describe.skipIf(!enabled)("administrator deletion authorization", () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const session = JSON.parse(process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'] || "{}");
  async function call(fn: string, data: Record<string, string>, authenticated: boolean) {
    if (!url || !key) throw new Error("Missing test configuration");
    return fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify(data),
    });
  }
  it("rejects unauthenticated account deletion", async () => {
    const response = await call("admin_delete_customer_account", { _user_id: session.user.id }, false);
    expect(response.ok).toBe(false);
  });
  it("rejects deletion of the signed-in administrator's own account", async () => {
    const response = await call("admin_delete_customer_account", { _user_id: session.user.id }, true);
    expect(response.ok).toBe(false);
    expect((await response.json()).message).toContain("propre compte");
  });
  it("rejects unauthenticated package deletion", async () => {
    const response = await call("admin_delete_package", { _package_id: "00000000-0000-0000-0000-000000000000" }, false);
    expect(response.ok).toBe(false);
  });
});