import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type infer as ZodInfer } from "zod";
import { AuthError, requireAuth, type AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status, headers: { "Cache-Control": "no-store" } });
}

// Same-origin check for state-changing requests (defence in depth on top of SameSite cookies)
function sameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; still need a valid session cookie
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson<S extends ZodTypeAny>(request: Request, schema: S): Promise<ZodInfer<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ServiceError(400, "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

type Handler = (ctx: AuthContext) => Promise<Response>;

// Authenticated route wrapper. Specific permissions are enforced by the service layer.
export async function withAuthRoute(request: Request, handler: Handler, options: { allowPasswordChange?: boolean } = {}) {
  try {
    if (!sameOrigin(request)) return jsonError(403, "Cross-origin request rejected.");
    const ctx = await requireAuth(options);
    const res = await handler(ctx);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.code === "UNAUTHENTICATED") return jsonError(401, "Unauthenticated");
      if (err.code === "PASSWORD_CHANGE_REQUIRED") return jsonError(403, "Password change required");
      return jsonError(403, "Forbidden");
    }
    if (err instanceof ServiceError) return jsonError(err.status, err.message);
    if (err instanceof ZodError) {
      // Unknown or invalid fields are rejected, never silently applied
      return jsonError(400, "Invalid request", err.issues.map(i => ({ path: i.path.join("."), message: i.message })));
    }
    console.error(err);
    return jsonError(500, "Internal Server Error");
  }
}
