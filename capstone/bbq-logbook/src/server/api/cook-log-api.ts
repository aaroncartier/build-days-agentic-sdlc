import { validateCookLog } from "../../shared/cook-log.js";
import type { CookLogStorage } from "../storage/cook-log-storage.js";

const cookLogsPath = "/api/cook-logs";
const livePath = "/health/live";
const readyPath = "/health/ready";

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function createCookLogApi(
  storage: CookLogStorage,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (path === livePath) {
      return request.method === "GET"
        ? jsonResponse({ status: "ok" })
        : jsonResponse({ error: "method_not_allowed" }, 405);
    }

    if (path === readyPath) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "method_not_allowed" }, 405);
      }
      try {
        await storage.checkAvailability();
        return jsonResponse({ status: "ready" });
      } catch {
        return jsonResponse({ status: "not_ready" }, 503);
      }
    }

    if (path !== cookLogsPath) {
      return jsonResponse({ error: "not_found" }, 404);
    }

    if (request.method === "GET") {
      try {
        return jsonResponse(await storage.list());
      } catch {
        return jsonResponse({ error: "storage_unavailable" }, 503);
      }
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const validation = validateCookLog(value);
    if (!validation.valid) {
      return jsonResponse(
        { error: "validation_failed", issues: validation.issues },
        400,
      );
    }

    try {
      return jsonResponse(await storage.create(validation.value), 201);
    } catch {
      return jsonResponse({ error: "storage_unavailable" }, 503);
    }
  };
}
