import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import { createCookLogApi } from "./api/cook-log-api.js";

const assets = new Map([
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/main.js", ["main.js", "text/javascript; charset=utf-8"]],
  ["/api.js", ["api.js", "text/javascript; charset=utf-8"]],
  ["/view.js", ["view.js", "text/javascript; charset=utf-8"]],
  ["/workflow.js", ["workflow.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

const defaultStaticRoot = fileURLToPath(
  new URL("../../client/", import.meta.url),
);

function writeJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(body);
}

export function createCookLogHttpServer(
  storage,
  { staticRoot = defaultStaticRoot } = {},
) {
  const api = createCookLogApi(storage);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const asset = url.pathname === "/"
        ? assets.get("/index.html")
        : assets.get(url.pathname);

      if (asset) {
        if (request.method !== "GET" && request.method !== "HEAD") {
          writeJson(response, 405, { error: "method_not_allowed" });
          return;
        }

        const [fileName, contentType] = asset;
        const content = await readFile(join(staticRoot, fileName));
        response.writeHead(200, {
          "Cache-Control": "no-cache",
          "Content-Length": content.byteLength,
          "Content-Type": contentType,
        });
        response.end(request.method === "HEAD" ? undefined : content);
        return;
      }

      const method = request.method ?? "GET";
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) headers.append(name, item);
        } else if (value !== undefined) {
          headers.set(name, value);
        }
      }
      const hasBody = method !== "GET" && method !== "HEAD";
      const apiRequest = new Request(url, {
        method,
        headers,
        ...(hasBody
          ? { body: Readable.toWeb(request), duplex: "half" }
          : {}),
      });
      const result = await api(apiRequest);
      const body = Buffer.from(await result.arrayBuffer());
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(body);
    } catch {
      if (!response.headersSent) {
        writeJson(response, 500, { error: "internal_error" });
      } else {
        response.destroy();
      }
    }
  });
}
