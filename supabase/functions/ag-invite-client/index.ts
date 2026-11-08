import { createClient } from "npm:@supabase/supabase-js@2.80.0";

const endpoint = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set(["https://aigents.help", "https://www.aigents.help"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, data: Record<string, unknown>, origin: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (!allowedOrigins.has(origin)) return new Response("Origin not allowed", { status: 403 });
  if (req.method === "OPTIONS") return json(204, {}, origin);
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, origin);
  if (!endpoint || !anonKey || !serviceKey) return json(503, { error: "Invitation service is not configured" }, origin);

  const bearer = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return json(401, { error: "Sign in required" }, origin);

  const auth = createClient(endpoint, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer);
  if (authError || !authData.user) return json(401, { error: "Invalid session" }, origin);

  const admin = createClient(endpoint, serviceKey, { auth: { persistSession: false } });
  const { data: role, error: roleError } = await admin.from("ag_staff").select("role")
    .eq("user_id", authData.user.id).maybeSingle();
  if (roleError || !role || !["owner", "admin", "manager"].includes(role.role))
    return json(403, { error: "Staff invitation permission required" }, origin);

  let input: { invitation_id?: unknown };
  try { input = await req.json(); } catch { return json(400, { error: "Invalid request" }, origin); }
  const id = typeof input.invitation_id === "string" ? input.invitation_id : "";
  if (!uuid.test(id)) return json(400, { error: "Invalid invitation ID" }, origin);

  const { data: invitation, error: invitationError } = await admin.from("ag_client_invitations")
    .select("id,client_id,email,created_by,accepted_by,expires_at,created_at")
    .eq("id", id).maybeSingle();
  if (invitationError || !invitation) return json(404, { error: "Invitation not found" }, origin);
  if (invitation.created_by !== authData.user.id && role.role !== "owner")
    return json(403, { error: "Only the inviter or owner can deliver this invitation" }, origin);
  if (invitation.accepted_by) return json(200, { status: "active", message: "Verified client member already linked" }, origin);
  if (Date.parse(invitation.expires_at) < Date.now())
    return json(409, { error: "Invitation expired; create a new invitation" }, origin);

  const { count, error: countError } = await admin.from("ag_client_invitations")
    .select("*", { count: "exact", head: true })
    .eq("created_by", authData.user.id)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if (countError) return json(503, { error: "Unable to check invitation limit" }, origin);
  if ((count ?? 0) > 25) return json(429, { error: "Invitation limit reached for this account today" }, origin);

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(invitation.email, {
    redirectTo: "https://aigents.help/office",
  });
  if (inviteError) {
    return json(409, {
      error: "Invitation could not be delivered. Check SMTP configuration or whether the account already exists.",
    }, origin);
  }
  return json(200, { status: "sent", message: "Supabase invitation sent to the client email" }, origin);
});
